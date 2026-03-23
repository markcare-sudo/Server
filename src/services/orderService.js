/**
 * @fileoverview Safe native business orchestration enforcing e-commerce transaction locks securely handling stock decrements natively.
 */

const { Op } = require("sequelize");
const { sequelize } = require("../config/db");
const { Order } = require("../models/Order");
const { OrderItem } = require("../models/OrderItem");
const { ProductVariant } = require("../models/ProductVariant");
const { User } = require("../modules/control-panel/ima/users/user.model");
const notificationService = require("./notificationService");
const { log: auditLog } = require("../utils/auditLogger");
const AppError = require("../utils/AppError");

const ORDER_STATUSES = Object.freeze({
  PLACED: "PLACED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  RETURNED: "RETURNED"
});

const ORDER_TRANSITIONS = {
  [ORDER_STATUSES.PLACED]: [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PROCESSING]: [ORDER_STATUSES.SHIPPED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.SHIPPED]: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.RETURNED],
  [ORDER_STATUSES.DELIVERED]: [ORDER_STATUSES.RETURNED],
};

const createOrder = async (tenantId, customerId, orderData) => {
  const { items, shipping_address, payment_method, notes } = orderData;
  if (!items || items.length === 0) throw new AppError("Order must contain items", 400);

  const t = await sequelize.transaction();
  try {
    let subtotal = 0;
    const orderItemsPayload = [];

    for (const item of items) {
      // 1. Fetch variant securely acquiring FOR UPDATE db locks eliminating concurrent double-spend race loops.
      const variant = await ProductVariant.findOne({
        where: { id: item.product_variant_id },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!variant) throw new AppError(`Variant ${item.product_variant_id} not found`, 404);

      // 2. Transact mathematical operations against locked row
      await ProductVariant.decrementStock(variant.id, item.quantity, t);

      const unitPrice = parseFloat(variant.price);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItemsPayload.push({
        product_variant_id: variant.id,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal: itemSubtotal
      });
    }

    // 3. Tax + Global Total mappings leveraging native JS floating mathematics (Phase 1 simplicity)
    const taxAmount = subtotal * 0.18; // 18% Flat GST equivalent 
    const discountAmount = 0; 
    const totalAmount = subtotal + taxAmount - discountAmount;

    // 4. Construct Order entity executing the sequential numbering hooks embedded inside options.transaction
    const order = await Order.create({
      tenant_id: tenantId,
      customer_id: customerId,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      payment_method,
      payment_status: "PENDING",
      shipping_address,
      notes
    }, { transaction: t }); 

    // 5. Build linked child parameters synchronously within locked state
    const bulkPayload = orderItemsPayload.map(i => ({ ...i, order_id: order.id }));
    await OrderItem.bulkCreate(bulkPayload, { transaction: t });

    await t.commit();

    const fetchedOrder = await getOrderById(order.id, tenantId);
    notificationService.notify(fetchedOrder.customer, 'ORDER_PLACED', { order: fetchedOrder });

    auditLog({
      userId: customerId,
      action: 'ORDER_CREATED',
      module: 'Order',
      entityId: fetchedOrder.id,
      newValues: { total: fetchedOrder.total_amount, items: items.length },
      tenantId
    });

    return fetchedOrder;
  } catch (e) {
    await t.rollback();
    throw new AppError(e.message, e.statusCode || 500);
  }
};

const updateOrderStatus = async (orderId, tenantId, newStatus, adminId) => {
  const order = await Order.findOne({ where: { id: orderId, tenant_id: tenantId } });
  if (!order) throw new AppError("Order not found", 404);

  const allowed = ORDER_TRANSITIONS[order.order_status] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(`Cannot transition from ${order.order_status} to ${newStatus}`, 400);
  }

  order.order_status = newStatus;
  await order.save();
  return order;
};

const cancelOrder = async (orderId, tenantId, customerId) => {
  const order = await Order.findOne({ 
    where: { id: orderId, tenant_id: tenantId },
    include: [{ model: OrderItem, as: "items" }]
  });
  if (!order) throw new AppError("Order not found", 404);

  if (!order.canBeCancelled()) {
    throw new AppError("Order cannot be cancelled in its current state", 400);
  }
  
  if (customerId && order.customer_id.toString() !== customerId.toString()) {
     throw new AppError("You do not own this order.", 403);
  }

  const t = await sequelize.transaction();
  try {
    for (const item of order.items) {
      if (item.product_variant_id) {
          await ProductVariant.increment('quantity_in_stock', {
            by: item.quantity,
            where: { id: item.product_variant_id },
            transaction: t
          });
      }
    }

    order.order_status = ORDER_STATUSES.CANCELLED;
    if (order.payment_status === "PENDING") {
      order.payment_status = "FAILED"; 
    }
    
    await order.save({ transaction: t });
    await t.commit();
    
    auditLog({
      userId: customerId || null,
      action: 'ORDER_CANCELLED',
      module: 'Order',
      entityId: orderId,
      tenantId
    });

    return order;
  } catch (e) {
    await t.rollback();
    throw new AppError(`Failed to cancel order: ${e.message}`, 500);
  }
};

const getOrderById = async (orderId, tenantId) => {
  const order = await Order.findOne({
    where: { id: orderId, tenant_id: tenantId },
    include: [
      { model: User, as: "customer", attributes: ["id", "name", "email"] },
      { 
        model: OrderItem, 
        as: "items", 
        include: [{ model: ProductVariant, as: "variant" }] 
      }
    ]
  });
  if (!order) throw new AppError("Order not found", 404);
  return order;
};

const listOrders = async (tenantId, filters) => {
  const { customerId, order_status, offset, limit } = filters;
  const where = { tenant_id: tenantId };
  if (customerId) where.customer_id = customerId;
  if (order_status) where.order_status = order_status;

  const { count, rows } = await Order.findAndCountAll({
    where, limit, offset, order: [["created_at", "DESC"]]
  });
  return { count, rows };
};

module.exports = { createOrder, updateOrderStatus, cancelOrder, getOrderById, listOrders };
