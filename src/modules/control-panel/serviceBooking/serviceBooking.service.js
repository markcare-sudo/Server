const razorpay = require("../../../config/razorpay");
const { sequelize } = require("../../../config/db");
const ApiError = require("../../../core/errors/ApiError");
const Payment = require("../orders/payment.model");
const ServiceBooking = require("./serviceBooking.model");
const crypto = require("crypto");
const { User } = require("../ima/users/user.model");
const { Service } = require("../service/service.model");
const Address = require("../address/address.model");
const { emitBookingUpdate, getIO } = require("../../../socket");



const generateBookingCode = () => `MCB-${Date.now()}`;


// ==========================================
// CREATE BOOKING
// ==========================================

async function createBooking(user_id, data) {

    const {
        service_id,
        address_id,
        scheduled_date,
        time_slot,
        payment_method,
        notes,
        total_amount
    } = data;

    return await sequelize.transaction(
        async (t) => {

            // ==============================
            // CREATE BOOKING
            // ==============================

            const booking =
                await ServiceBooking.create({

                    user_id,
                    service_id,
                    address_id,
                    scheduled_date,
                    time_slot,
                    payment_method,
                    total_amount,
                    notes,

                    booking_code:
                        generateBookingCode(),

                    status:
                        payment_method === "COD"
                            ? "CONFIRMED"
                            : "PENDING",

                    payment_status:
                        payment_method === "COD"
                            ? "UNPAID"
                            : "PENDING"

                }, {
                    transaction: t
                });

            let razorpayOrder = null;
            let payment = null;

            // =====================================
            // ONLINE PAYMENT
            // =====================================

            if (payment_method === "ONLINE") {

                const amountInPaise =
                    Math.round(
                        parseFloat(total_amount) * 100
                    );

                try {

                    razorpayOrder =
                        await razorpay.orders.create({

                            amount: amountInPaise,
                            currency: "INR",

                            receipt:
                                `bk_${booking.id}`
                                    .slice(0, 40),

                        });

                    payment =
                        await Payment.create({

                            booking_id: booking.id,

                            provider: "razorpay",

                            method: "ONLINE",

                            amount: total_amount,

                            transaction_id:
                                razorpayOrder.id,

                            status: "pending",

                            payment_response:
                                razorpayOrder,

                        }, {
                            transaction: t
                        });

                } catch (error) {

                    console.error(
                        "❌ Razorpay Error:",
                        error
                    );

                    throw new ApiError(
                        error.statusCode || 500,
                        error.error?.description ||
                        "Razorpay integration failed"
                    );
                }
            }

            // =====================================
            // COD PAYMENT
            // =====================================

            if (payment_method === "COD") {

                payment =
                    await Payment.create({

                        booking_id: booking.id,

                        provider: "cod",

                        method: "COD",

                        amount: total_amount,

                        status: "pending",

                        transaction_id: null,

                    }, {
                        transaction: t
                    });

                // =====================================
                // REALTIME EVENT
                // =====================================

                const io = getIO();

                io?.to("admins").emit(
                    "new-booking",
                    {
                        id: booking.id,
                        booking_code:
                            booking.booking_code,

                        total_amount:
                            booking.total_amount,

                        payment_method:
                            booking.payment_method,

                        payment_status:
                            booking.payment_status,

                        status:
                            booking.status,

                        created_at:
                            booking.createdAt,
                    }
                );

                console.log(
                    "🔥 COD Booking emitted"
                );
            }

            return {
                booking,
                razorpayOrder,
                payment
            };
        }
    );
}

// ==========================================
// VERIFY PAYMENT
// ==========================================

async function verifyPayment(data) {

    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = data;

        // =====================================
        // VERIFY SIGNATURE
        // =====================================

        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(
                    `${razorpay_order_id}|${razorpay_payment_id}`
                )
                .digest("hex");

        if (
            generatedSignature !==
            razorpay_signature
        ) {

            throw new ApiError(
                400,
                "Invalid payment signature"
            );
        }

        return await sequelize.transaction(
            async (t) => {

                // =====================================
                // FIND PAYMENT
                // =====================================

                const payment =
                    await Payment.findOne({

                        where: {
                            transaction_id:
                                razorpay_order_id
                        },

                        transaction: t,
                    });

                if (!payment) {

                    throw new ApiError(
                        404,
                        "Payment not found"
                    );
                }

                // =====================================
                // UPDATE PAYMENT
                // =====================================

                await payment.update({

                    status: "success",

                    razorpay_payment_id,

                    payment_response: data,

                }, {
                    transaction: t,
                });

                // =====================================
                // FIND BOOKING
                // =====================================

                const booking =
                    await ServiceBooking.findByPk(

                        payment.booking_id,

                        {
                            transaction: t
                        }
                    );

                if (!booking) {

                    throw new ApiError(
                        404,
                        "Booking not found"
                    );
                }

                // =====================================
                // UPDATE BOOKING
                // =====================================

                await booking.update({

                    payment_status: "PAID",

                    status: "CONFIRMED",

                    transaction_id:
                        razorpay_payment_id,

                }, {
                    transaction: t,
                });

                // =====================================
                // REALTIME EVENTS
                // =====================================

                const io = getIO();

                // ADMIN EVENT

                io?.to("admins").emit(
                    "new-booking",
                    {
                        id: booking.id,

                        booking_code:
                            booking.booking_code,

                        total_amount:
                            booking.total_amount,

                        payment_method:
                            booking.payment_method,

                        payment_status:
                            booking.payment_status,

                        status:
                            booking.status,

                        created_at:
                            booking.createdAt,
                    }
                );

                // BOOKING ROOM EVENT

                emitBookingUpdate(
                    booking.id,
                    "payment-success",
                    {
                        booking_id: booking.id,

                        payment_status: "PAID",

                        status: "CONFIRMED",
                    }
                );

                console.log(
                    "🔥 ONLINE Booking emitted"
                );

                return {

                    success: true,

                    message:
                        "Payment verified successfully",

                    booking,
                };
            }
        );

    } catch (error) {

        console.error(
            "❌ Payment Verification Error:",
            error
        );

        throw error;
    }
}



// async function createBooking(user_id, data) {
//     const {
//         service_id,
//         address_id,
//         scheduled_date,
//         time_slot,
//         payment_method,
//         notes,
//         total_amount
//     } = data;

//     return await sequelize.transaction(async (t) => {

//         // ==============================
//         // CREATE BOOKING
//         // ==============================

//         const booking = await ServiceBooking.create({
//             user_id,
//             service_id,
//             address_id,
//             scheduled_date,
//             time_slot,
//             payment_method,
//             total_amount,
//             notes,
//             booking_code: generateBookingCode(),
//             status: payment_method === "COD" ? "CONFIRMED" : "PENDING",
//             payment_status: payment_method === "COD" ? "UNPAID" : "PENDING"
//         }, {
//             transaction: t
//         });

//         let razorpayOrder = null;
//         let payment = null;

//         // ==============================
//         // ONLINE PAYMENT
//         // ==============================

//         if (payment_method === "ONLINE") {

//             const amountInPaise =
//                 Math.round(parseFloat(total_amount) * 100);

//             try {

//                 console.log("Sending to Razorpay:", {
//                     amount: amountInPaise,
//                     currency: "INR",
//                     receipt: `bk_${booking.id}`.slice(0, 40)
//                 });

//                 // CREATE RAZORPAY ORDER
//                 razorpayOrder = await razorpay.orders.create({
//                     amount: amountInPaise,
//                     currency: "INR",
//                     receipt: `bk_${booking.id}`.slice(0, 40),
//                 });

//                 // IMPORTANT:
//                 // SAVE PAYMENT RECORD
//                 payment = await Payment.create({
//                     booking_id: booking.id,
//                     provider: "razorpay",
//                     method: "ONLINE",
//                     amount: total_amount,

//                     // SAVE ORDER ID HERE
//                     transaction_id: razorpayOrder.id,

//                     status: "pending",
//                     payment_response: razorpayOrder,
//                 }, {
//                     transaction: t
//                 });

//                 // ==============================
//                 // REALTIME EVENT FOR COD
//                 // ==============================

//                 const io = getIO();

//                 if (io) {

//                     io.of("/bookings").emit(
//                         "booking:new",
//                         {
//                             id: booking.id,
//                             booking_code: booking.booking_code,
//                             total_amount: booking.total_amount,
//                             payment_method: booking.payment_method,
//                             status: booking.status,
//                         }
//                     );

//                     console.log(
//                         "🔥 booking:new emitted"
//                     );
//                 }


//             } catch (error) {

//                 console.error(
//                     "ACTUAL RAZORPAY ERROR:",
//                     JSON.stringify(error, null, 2)
//                 );

//                 throw new ApiError(
//                     error.statusCode || 500,
//                     error.error?.description || "Razorpay integration failed"
//                 );
//             }
//         }

//         // ==============================
//         // COD PAYMENT
//         // ==============================

//         if (payment_method === "COD") {

//             payment = await Payment.create({
//                 order_id: booking.id,
//                 provider: "cod",
//                 method: "COD",
//                 amount: total_amount,
//                 status: "pending",
//                 transaction_id: null,
//             }, {
//                 transaction: t
//             });
//         }

//         return {
//             booking,
//             razorpayOrder,
//             payment
//         };
//     });
// }

// async function verifyPayment(data) {
//     try {
//         const {
//             razorpay_order_id,
//             razorpay_payment_id,
//             razorpay_signature,
//         } = data;

//         // ==============================
//         // VERIFY SIGNATURE
//         // ==============================

//         const generatedSignature = crypto
//             .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//             .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//             .digest("hex");

//         if (generatedSignature !== razorpay_signature) {
//             throw new ApiError(400, "Invalid payment signature");
//         }

//         // ==============================
//         // DB TRANSACTION
//         // ==============================

//         return await sequelize.transaction(async (t) => {

//             // IMPORTANT:
//             // During create order you must save:
//             // transaction_id = razorpayOrder.id
//             // NOT receipt id

//             const payment = await Payment.findOne({
//                 where: {
//                     transaction_id: razorpay_order_id
//                 },
//                 transaction: t,
//             });

//             if (!payment) {
//                 console.error("❌ Payment Not Found");
//                 console.error("Searching Order ID:", razorpay_order_id);

//                 const allPayments = await Payment.findAll({
//                     attributes: ["id", "transaction_id", "order_id", "status"],
//                     transaction: t,
//                 });

//                 console.table(
//                     allPayments.map(p => ({
//                         id: p.id,
//                         transaction_id: p.transaction_id,
//                         order_id: p.order_id,
//                         status: p.status,
//                     }))
//                 );

//                 throw new ApiError(
//                     404,
//                     `Payment record not found for order: ${razorpay_order_id}`
//                 );
//             }

//             // ==============================
//             // UPDATE PAYMENT
//             // ==============================

//             await payment.update({
//                 status: "success",
//                 razorpay_payment_id,
//                 payment_response: data,
//             }, {
//                 transaction: t,
//             });

//             // ==============================
//             // UPDATE BOOKING
//             // ==============================

//             const booking = await ServiceBooking.findByPk(
//                 payment.booking_id,
//                 { transaction: t }
//             );

//             if (!booking) {
//                 throw new ApiError(404, "Booking not found");
//             }

//             await booking.update({
//                 payment_status: "PAID",
//                 status: "CONFIRMED",
//                 transaction_id: razorpay_payment_id,
//             }, {
//                 transaction: t,
//             });

//             // ==============================
//             // REALTIME EVENTS
//             // ==============================

//             const io = getIO();

//             // ADMIN PANEL NOTIFICATION
//             io?.of("/bookings")
//                 .to("admins")
//                 .emit("new-booking", {
//                     type: "NEW_BOOKING",
//                     booking_id: booking.id,
//                     booking_code: booking.booking_code,
//                     payment_method: "ONLINE",
//                     status: booking.status,
//                     created_at: booking.createdAt,
//                 });

//             // BOOKING ROOM UPDATE
//             emitBookingUpdate(
//                 booking.id,
//                 "payment-success",
//                 {
//                     booking_id: booking.id,
//                     payment_status: "PAID",
//                     status: "CONFIRMED",
//                 }
//             );

//             return {
//                 success: true,
//                 message: "Payment verified successfully",
//                 booking,
//             };
//         });

//     } catch (error) {
//         console.error("❌ Service Payment Verification Error:", error);
//         throw error;
//     }
// }

async function getUserBookings(user_id) {
    return await ServiceBooking.findAll({
        where: { user_id },
        order: [["created_at", "DESC"]]
    });
}


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