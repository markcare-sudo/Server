const razorpay = require("../../../config/razorpay");
const ApiError = require("../../../core/errors/ApiError");
const Address = require("../address/address.model");
const { User } = require("../ima/users/user.model");
const Payment = require("../orders/payment.model");
const { Service } = require("../service/service.model");
const ServiceBooking = require("./serviceBooking.model");
const { Op } = require("sequelize");


const generateBookingCode = () => `MCB-${Date.now()}`;

async function createBooking(user_id, data) {
    const { service_id, address_id, scheduled_date, time_slot, payment_method, notes, total_amount } = data;

    let booking, razorpayOrder = null, payment = null;

    // =========================
    // CREATE BOOKING
    // =========================
    booking = await ServiceBooking.create({
        user_id,
        service_id,
        address_id,
        scheduled_date,
        time_slot,
        payment_method,
        total_amount,
        notes,
        booking_code: generateBookingCode(),
        status: payment_method === "COD" ? "CONFIRMED" : "PENDING",
        payment_status: payment_method === "COD" ? "UNPAID" : "PENDING"
    });

    // =========================
    // ONLINE PAYMENT
    // =========================
    if (payment_method === "ONLINE") {
        razorpayOrder = await razorpay.orders.create({
            amount: Math.round(total_amount * 100),
            currency: "INR",
            receipt: `booking_${booking.id}`,
        });

        payment = await Payment.create({
            order_id: booking.id,
            provider: "razorpay",
            amount: total_amount,
            status: "pending",
            transaction_id: razorpayOrder.id,
        });
    }

    // =========================
    // COD PAYMENT
    // =========================
    if (payment_method === "COD") {
        payment = await Payment.create({
            order_id: booking.id,
            provider: "cod",
            amount: total_amount,
            status: "pending",
        });
    }

    return { booking, razorpayOrder, payment };
}

async function verifyPayment(data) {
    const { razorpay_order_id, razorpay_payment_id } = data;

    const payment = await Payment.findOne({
        where: { transaction_id: razorpay_order_id }
    });

    if (!payment) throw new ApiError(404, "Payment not found");

    const booking = await ServiceBooking.findByPk(payment.booking_id);

    await payment.update({
        status: "success",
        transaction_id: razorpay_payment_id
    });

    await booking.update({
        payment_status: "PAID",
        status: "CONFIRMED",
        transaction_id: razorpay_payment_id
    });

    return booking;
}

async function getUserBookings(user_id) {
    return await ServiceBooking.findAll({
        where: { user_id },
        order: [["created_at", "DESC"]]
    });
}

// async function getAllBookings(query = {}) {
//     const { page, limit, search, status, payment_status, payment_method } = query;
//     return await ServiceBooking.findAll({
//         order: [["created_at", "DESC"]]
//     });
// }



async function getAllBookings(query = {}) {
    const {
        page = 1,
        limit = 10,
        search,
        status,
        payment_status,
        payment_method,
        startDate,
        endDate
    } = query;

    const offset = (page - 1) * limit;

    // =========================
    // 🔍 WHERE CONDITIONS
    // =========================
    let where = {};

    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (payment_method) where.payment_method = payment_method;

    // 📅 Date filter
    if (startDate && endDate) {
        where.created_at = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    }

    // 🔎 Search (booking_code / user)
    if (search) {
        where[Op.or] = [
            { booking_code: { [Op.iLike]: `%${search}%` } }
        ];
    }

    // =========================
    // 📦 QUERY
    // =========================
    const { count, rows } = await ServiceBooking.findAndCountAll({
        where,
        offset,
        limit: Number(limit),
        order: [["created_at", "DESC"]],

        include: [
            {
                model: User,
                as: "user",
                attributes: ["id", "name", "email"]
            },
            {
                model: Service,
                as: "service",
                attributes: ["id", "name"]
            },
            {
                model: Address,
                as: "address",
                attributes: ["id", "city", "state"]
            }
        ]
    });

    // =========================
    // 📊 PAGINATION
    // =========================
    return {
        data: rows,
        pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(count / limit)
        }
    };
}

async function getBookingById(id) {
    const booking = await ServiceBooking.findByPk(id);
    if (!booking) throw new ApiError(404, "Booking not found");
    return booking;
}

async function updateBooking(id, data) {
    const booking = await ServiceBooking.findByPk(id);
    if (!booking) throw new ApiError(404, "Booking not found");

    await booking.update(data);
    return booking;
}

async function assignTechnician(id, technician_id) {
    const booking = await ServiceBooking.findByPk(id);
    if (!booking) throw new ApiError(404, "Booking not found");

    await booking.update({
        technician_id,
        status: "ASSIGNED"
    });

    return booking;
}

async function cancelBooking(id) {
    const booking = await ServiceBooking.findByPk(id);
    if (!booking) throw new ApiError(404, "Booking not found");

    await booking.update({
        status: "CANCELLED"
    });

    return booking;
}

module.exports = {
    createBooking,
    verifyPayment,
    getUserBookings,
    getAllBookings,
    getBookingById,
    updateBooking,
    assignTechnician,
    cancelBooking
};