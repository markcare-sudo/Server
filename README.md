# MarkCare Backend API

The MarkCare Backend powers a dual marketplace for Services and Products, natively integrating PostgreSQL TSVECTOR Search, Socket.io Real-Time Bookings, and secure transactional Ledgers.

## Setup & Configuration

To run the application locally or in production, you must supply the necessary environment variables defined in `.env.example`. Create a `.env` file in the root directory mapping the following logical groups:

### 1. SERVER & DATABASE
- **`NODE_ENV`**: Sets the runtime environment (e.g., `development`, `production`).
- **`PORT`**: The Express HTTP port (default `3000`).
- **Database Keys**: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` authenticate your local or remote PostgreSQL instance.

### 2. AUTHENTICATION (Mandatory)
- **`JWT_SECRET`**: Required to physically sign user/provider authentication payloads securely.
- **`JWT_REFRESH_SECRET`**: Required for generating persistent refresh tokens preventing unauthorized session overlaps.

### 3. RAZORPAY (Payments)
- **`RAZORPAY_KEY_ID` & `RAZORPAY_SECRET`**: Obtained from your Razorpay Dashboard dynamically wrapping payment generation.
- **`RAZORPAY_WEBHOOK_SECRET`**: Strictly protects incoming asynchronous Webhook updates (ensure this matches your dashboard config).

### 4. THIRD-PARTY APIs (Optional in Dev, Required in Prod)
- **Twilio**: SMS Dispatching (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`).
- **Email (SMTP)**: Standard nodemailer credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`).
- **Cloudinary**: Real-time CDN storage (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).

## Running the Project
1. Clone the repository and run `npm install`.
2. Map your `.env` securely.
3. Start the server (e.g., `npm run dev` or `node src/local.js`). The runtime will gracefully halt and log exactly which critical variables are missing dynamically if incorrectly configured.
