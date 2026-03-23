# MarkCare: Services + Products Integration Architecture Plan

**Document Version:** 1.0  
**Date:** March 19, 2026  
**Status:** For Review & Approval

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Urban Company Backend Architecture Analysis](#urban-company-backend-architecture-analysis)
3. [Current MarkCare Architecture Review](#current-markcare-architecture-review)
4. [Gap Analysis: What Needs to Be Added](#gap-analysis-what-needs-to-be-added)
5. [Proposed Data Model & Database Schema](#proposed-data-model--database-schema)
6. [Feature Requirements](#feature-requirements)
7. [Integration Points & Flow Diagrams](#integration-points--flow-diagrams)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Tech Stack & Tools](#tech-stack--tools)

---

## Executive Summary

**Current State:** MarkCare is a multi-tenant backend supporting **services only** (authentication, blogs, RBAC, audit logging).

**Target State:** Extend MarkCare to support a **dual-model marketplace** like Urban Company:
- **Services**: On-demand professional services (salon, cleaning, repairs) booked with professionals
- **Products**: Physical products (appliances, parts) sold and delivered

**Complexity:** Urban Company's backend is significantly more complex than current MarkCare, requiring:
- 🛒 **E-Commerce Engine** (products, inventory, cart, checkout)
- 📅 **Service Booking System** (availability, scheduling, professional assignment)
- 🗺️ **Geo-Location Services** (finding nearby professionals/delivery partners)
- 💳 **Payment Integration** (multiple payment methods, refunds, wallet)
- 📦 **Logistics** (delivery tracking, partner management)
- 🔄 **Dual Pricing Systems** (time-based for services, quantity-based for products)

---

## Urban Company Backend Architecture Analysis

### 1. **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    URBAN COMPANY SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CLIENT LAYER (Frontend)                      │  │
│  │  • Customer App  • Professional App  • Admin Panel        │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │ API Calls                             │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │            API GATEWAY & LOAD BALANCER                    │  │
│  │  • Request Routing  • Rate Limiting  • Authentication     │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │           MICROSERVICES / BUSINESS LOGIC                  │  │
│  │                                                            │  │
│  │  ├─ User Service (Customers & Professionals)             │  │
│  │  ├─ Service Catalog & Inventory Management               │  │
│  │  ├─ Booking & Scheduling Engine                          │  │
│  │  ├─ E-Commerce (Products, Cart, Orders)                  │  │
│  │  ├─ Payment Processing & Wallet                          │  │
│  │  ├─ Pricing Engine (Dynamic pricing, discounts)          │  │
│  │  ├─ Professional Matching & Assignment                   │  │
│  │  ├─ Notifications (SMS, Email, Push)                     │  │
│  │  ├─ Reviews & Ratings                                    │  │
│  │  ├─ Analytics & Reporting                                │  │
│  │  └─ Search & Discovery (Elasticsearch)                   │  │
│  │                                                            │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │         DATA LAYER (PostgreSQL/MySQL)                     │  │
│  │                                                            │  │
│  │  ├─ Users, Professionals, Tenants                         │  │
│  │  ├─ Services, Products, Inventory                         │  │
│  │  ├─ Bookings, Orders, Transactions                        │  │
│  │  ├─ Payments, Wallet, Settlements                         │  │
│  │  ├─ Reviews, Ratings, Feedback                            │  │
│  │  └─ Audit Logs, Analytics Events                          │  │
│  │                                                            │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │      SUPPORTING SERVICES & INTEGRATIONS                   │  │
│  │                                                            │  │
│  │  ├─ Redis Cache (Session, Caching, Rate Limit)           │  │
│  │  ├─ Message Queue (Job Processing - Bull/RabbitMQ)       │  │
│  │  ├─ File Storage (AWS S3, Cloudinary)                     │  │
│  │  ├─ Geolocation Service (Maps API)                        │  │
│  │  ├─ Payment Gateway (Razorpay, Stripe)                    │  │
│  │  ├─ Notification Service (Twilio SMS, Nodemailer)         │  │
│  │  ├─ Search Engine (Elasticsearch, Algolia)                │  │
│  │  └─ Analytics (Mixpanel, Segment)                         │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2. **Key Urban Company Features**

#### **A. Service Listing and Booking**
- **Multiple categories**: Salon, Spa, Cleaning, Repair (AC, Appliances, Plumbing, Electrical, Carpentry)
- **Service variants**: E.g., "Intense Cleaning" has variants for 2/3 bathrooms with different pricing
- **Availability slots**: Real-time availability based on professional's schedule
- **Time-based pricing**: Services show "45 mins", "Instant" delivery, and hourly costs
- **Professional assignment**: Auto-matching based on location, rating, availability

#### **B. Product Selling** (NEW - Recently Added)
- **Native Water Purifier** - Product with fixed price
- **One-time purchase** vs. **Subscription models**
- **Inventory management** for products
- **Delivery partner assignment** (different from service professionals)

#### **C. Pricing Strategy**
- **Base price + Discounts**: Shows original price struck through
- **Dynamic pricing**: May vary by location/demand
- **Packages**: Multi-service bundles (e.g., "4 sessions" massage)
- **Instant vs. Scheduled**: Different pricing for same-day vs. future bookings

#### **D. Professional Management**
- **Rating system**: Individual service ratings (4.8 out of 5)
- **Professional portfolio**: Skills, certifications, past work
- **Availability calendar**: Block times when unavailable
- **Verification & Badges**: Trust indicators

#### **E. Payment & Transactions**
- **Multiple payment methods**: Card, UPI, Wallet, Razorpay integration
- **Wallet system**: Pre-loaded balance for quick checkout
- **Refunds & Cancellations**: Service-specific cancellation policies
- **Professional payouts**: Settlement to professional bank accounts

#### **F. Search & Discovery**
- **Category browsing**: Home screen has organized categories
- **Location-based search**: "Near Me" feature finds services in your area
- **Search with filters**: Sort by price, rating, availability
- **Trending/Most booked**: "Most booked services" carousel

#### **G. User Experience Features**
- **Real-time status tracking**: Track professional's arrival
- **In-app chat**: Communicate with professional before/after service
- **Review & rating**: Customer feedback on professionals
- **Repeat bookings**: Quick rebooking of favorite services

---

## Current MarkCare Architecture Review

### **Strengths**
✅ **Authentication**: OTP-based login/signup, JWT tokens, refresh tokens  
✅ **RBAC**: Role-based access control with permissions  
✅ **Multi-tenant ready**: Tenant-scoped users and roles  
✅ **Blog system**: Content management for articles  
✅ **Audit logging**: All actions tracked for compliance  
✅ **File handling**: Cloudinary integration for media  
✅ **Scalable foundation**: Sequelize ORM, Postgres support  
✅ **Serverless ready**: AWS Lambda deployment support  

### **Gaps for Services + Products Model**
❌ **No booking/scheduling system** - No calendar, availability, appointment management  
❌ **No professional/provider management** - No gig worker support  
❌ **No order/transaction system** - No orders, invoices, receipts  
❌ **No payment integration** - Only supports Razorpay, needs refund handling  
❌ **No inventory system** - Can't track product stock  
❌ **No geo-location services** - No nearby search or mapping  
❌ **No notification system** - Missing SMS/Email for booking updates  
❌ **No search/discovery** - Limited to blog search, no faceted search for services  
❌ **No cart/checkout system** - No e-commerce flow  
❌ **No review/rating system** - No user feedback mechanism  
❌ **No real-time updates** - WebSocket support exists but not integrated for live tracking  

---

## Gap Analysis: What Needs to Be Added

### **TIER 1: CRITICAL (Must Have - Phase 1)**

#### **1. Professional/Service Provider Management**
```
Database:
- ServiceProvider (id, tenant_id, user_id, category, skills, certifications, rating)
- ServiceProviderAvailability (id, provider_id, day_of_week, start_time, end_time)
- ServiceProviderLocation (id, provider_id, latitude, longitude, service_radius)

Features:
- Register service provider
- Upload certifications & portfolio
- Manage availability calendar
- Location-based matching
```

#### **2. Service Catalog Management**
```
Database:
- Service (id, tenant_id, name, category, description, base_price)
- ServiceVariant (id, service_id, name, duration, price, description)
- ServiceSchedule (id, service_id, provider_id, datetime, available_slots)

Features:
- Create/manage service offerings
- Define variants (e.g., 2 bedroom cleaning vs 3 bedroom)
- Set duration and pricing
- Real-time slot availability
```

#### **3. Booking & Scheduling Engine**
```
Database:
- Booking (id, tenant_id, customer_id, service_id, provider_id, datetime, status, price)
- BookingStatus: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED → CANCELLED
- BookingTimeline (id, booking_id, status, timestamp, notes)

Features:
- Create booking with available slots
- Real-time slot updates
- Booking confirmation
- Automatic provider assignment
- Cancellation with policies (time-based refunds)
```

#### **4. Product Management & Inventory**
```
Database:
- Product (id, tenant_id, name, description, category, price)
- ProductVariant (id, product_id, name, sku, price)
- Inventory (id, product_id, quantity_available, warehouse_id)
- ProductListing (id, tenant_id, product_id, featured_image, description)

Features:
- Add/edit products with variants
- Track inventory levels
- Image upload for products
- Product categorization
```

#### **5. Order Management (E-Commerce)**
```
Database:
- Order (id, tenant_id, customer_id, order_date, total_amount, status)
- OrderItem (id, order_id, product_id, quantity, price, discount)
- OrderTimeline (id, order_id, status, timestamp)

Features:
- Create orders from cart
- Order status tracking
- Invoice generation
- Return/refund processing
```

#### **6. Payment Processing Enhancement**
```
Database:
- Payment (id, booking_id/order_id, amount, method, status, transaction_id)
- Refund (id, payment_id, amount, reason, status)
- Wallet (id, user_id, balance, last_updated)
- WalletTransaction (id, wallet_id, amount, type, reference_id)

Features:
- Process payments for both services & products
- Wallet integration
- Refund automation
- Payment failure handling
```

#### **7. Review & Rating System**
```
Database:
- Review (id, tenant_id, reviewer_id (customer), reviewee_id (provider), booking_id, rating, comment)
- ReviewImage (id, review_id, image_url)

Features:
- Post review after service/product delivery
- Star rating (1-5)
- Photo uploads
- Aggregate ratings for providers/products
```

---

### **TIER 2: IMPORTANT (Should Have - Phase 2)**

#### **8. Notifications System**
```
Modules:
- SMS (Twilio): Booking confirmation, status updates, payment receipts
- Email (Nodemailer): Detailed summaries, receipts
- In-app Push (Web-push, Socket.io): Real-time updates
- Notification Templates: Dynamic content with variables

Features:
- Event-driven notifications
- Notification preferences per user
- Retry logic for failed deliveries
- Notification history
```

#### **9. Search & Discovery**
```
Database:
- ServiceIndex (Elasticsearch/Algolia)
- ProductIndex (Elasticsearch/Algolia)

Features:
- Full-text search for services & products
- Faceted filters (category, price range, rating, distance)
- Autocomplete suggestions
- Trending/Popular items
- Personalized recommendations
```

#### **10. Geolocation Services**
```
Integrations:
- Google Maps API: Distance calculation, routing
- Geohashing: Efficient location-based querying

Features:
- Find nearby professionals/services
- Delivery location validation
- Service area coverage
- Distance-based pricing
```

#### **11. Cart System**
```
Database:
- Cart (id, user_id, created_at, updated_at)
- CartItem (id, cart_id, product_id, quantity, service_id, booking_datetime)

Features:
- Add/remove items
- Update quantities
- Apply coupon codes
- Persistent cart
- Cart total calculation
```

#### **12. Coupon & Discount System**
```
Database:
- Coupon (id, tenant_id, code, discount_type, discount_value, max_uses, expiry)
- CouponUsage (id, coupon_id, user_id, order_id, used_at)
- PromotionalOffer (id, tenant_id, service_id/product_id, discount_value, validity)

Features:
- Create promotional coupons
- Apply discount codes
- Track usage limits
- Automatic discount application
```

---

### **TIER 3: NICE TO HAVE (Phase 3)**

#### **13. Real-Time Tracking**
```
Features:
- Professional's live location during service
- Estimated time of arrival
- Real-time booking status updates
- Customer & professional notifications

Tech: Socket.io integration with Redis for scalability
```

#### **14. Analytics & Reporting**
```
Dashboard Metrics:
- Revenue analytics
- Booking trends
- Popular services/products
- Professional performance
- Customer demographics
- Refund/cancellation rates

Tech: Event tracking with Segment/Mixpanel
```

#### **15. Loyalty Program**
```
Database:
- LoyaltyProgram (id, tenant_id, name, points_per_rupee)
- UserPoints (id, user_id, points_balance, tier)
- PointsTransaction (id, user_id, points, type, reference_id)

Features:
- Earn points on purchases
- Redeem points for discounts
- Tier-based benefits
```

#### **16. Professional Onboarding Workflow**
```
Features:
- Application form submission
- Document verification (ID, certification)
- Background checks
- Training & orientation
- Performance monitoring
- Dispute resolution
```

---

## Proposed Data Model & Database Schema

### **New Tables Required**

```sql
-- PROFESSIONALS/SERVICE PROVIDERS
CREATE TABLE service_providers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  user_id BIGINT UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  category VARCHAR(100),
  skills TEXT,
  certifications TEXT,
  experience_years INT,
  rating DECIMAL(3,2) DEFAULT 0,
  total_bookings INT DEFAULT 0,
  active_status ENUM('ACTIVE', 'INACTIVE', 'BLOCKED'),
  verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED'),
  kyc_details JSON,
  bank_account JSON,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  service_radius_km INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_tenant_category (tenant_id, category),
  INDEX idx_location (latitude, longitude),
  INDEX idx_rating (rating DESC)
);

-- SERVICES
CREATE TABLE services (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE,
  description TEXT,
  category VARCHAR(100),
  base_price DECIMAL(10,2),
  featured_image VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_tenant_category (tenant_id, category),
  FULLTEXT INDEX idx_search (name, description)
);

-- SERVICE VARIANTS
CREATE TABLE service_variants (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  service_id BIGINT NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  duration_minutes INT,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id),
  INDEX idx_service (service_id)
);

-- SERVICE PROVIDER AVAILABILITY
CREATE TABLE service_provider_availability (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  service_provider_id BIGINT NOT NULL,
  day_of_week INT (0-6), -- 0=Sunday, 6=Saturday
  start_time TIME,
  end_time TIME,
  break_start TIME,
  break_end TIME,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (service_provider_id) REFERENCES service_providers(id),
  INDEX idx_provider (service_provider_id)
);

-- BOOKINGS
CREATE TABLE bookings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  customer_id BIGINT NOT NULL,
  service_id BIGINT NOT NULL,
  service_variant_id BIGINT,
  service_provider_id BIGINT,
  booking_datetime DATETIME,
  service_address TEXT,
  service_latitude DECIMAL(10,8),
  service_longitude DECIMAL(11,8),
  status ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'),
  base_price DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  final_price DECIMAL(10,2),
  payment_method VARCHAR(50),
  payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
  cancellation_reason VARCHAR(500),
  cancelled_by ENUM('CUSTOMER', 'PROFESSIONAL', 'ADMIN'),
  refund_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (service_provider_id) REFERENCES service_providers(id),
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_customer (customer_id),
  INDEX idx_provider (service_provider_id),
  INDEX idx_datetime (booking_datetime)
);

-- BOOKING TIMELINE (tracks status changes)
CREATE TABLE booking_timeline (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  booking_id BIGINT NOT NULL,
  status VARCHAR(50),
  changed_at TIMESTAMP,
  changed_by BIGINT,
  notes TEXT,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  INDEX idx_booking (booking_id)
);

-- PRODUCTS
CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE,
  description TEXT,
  category VARCHAR(100),
  featured_image VARCHAR(500),
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_tenant_category (tenant_id, category),
  FULLTEXT INDEX idx_search (name, description)
);

-- PRODUCT VARIANTS
CREATE TABLE product_variants (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  name VARCHAR(200),
  sku VARCHAR(100) UNIQUE,
  price DECIMAL(10,2),
  quantity_in_stock INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ORDERS
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  customer_id BIGINT NOT NULL,
  order_number VARCHAR(50) UNIQUE,
  subtotal DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  payment_method VARCHAR(50),
  payment_status ENUM('PENDING', 'COMPLETED', 'FAILED'),
  order_status ENUM('PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'),
  shipping_address JSON,
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  INDEX idx_tenant_status (tenant_id, order_status),
  INDEX idx_customer (customer_id)
);

-- ORDER ITEMS
CREATE TABLE order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_variant_id BIGINT,
  quantity INT,
  unit_price DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
  INDEX idx_order (order_id)
);

-- REVIEWS AND RATINGS
CREATE TABLE reviews (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  booking_id BIGINT,
  order_id BIGINT,
  reviewer_id BIGINT NOT NULL,
  reviewee_id BIGINT NOT NULL, -- Service provider or product seller
  review_type ENUM('SERVICE', 'PRODUCT'),
  rating INT CONSTRAINT rating_check CHECK(rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  is_verified_purchase BOOLEAN,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (reviewee_id) REFERENCES users(id),
  INDEX idx_reviewee_rating (reviewee_id, rating),
  INDEX idx_recent (created_at DESC)
);

-- PAYMENTS
CREATE TABLE payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  reference_type ENUM('BOOKING', 'ORDER'), -- What this payment is for
  reference_id BIGINT,
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50),
  provider_transaction_id VARCHAR(100),
  status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'),
  metadata JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_user (user_id)
);

-- CARTS
CREATE TABLE carts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  items JSON, -- [{product_id, quantity}, {service_id, service_variant_id, booking_datetime}]
  subtotal DECIMAL(10,2),
  discount_code_applied VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_user_cart (user_id)
);

-- COUPONS
CREATE TABLE coupons (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type ENUM('PERCENTAGE', 'FIXED',  'FREE_DELIVERY'),
  discount_value DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  min_purchase_amount DECIMAL(10,2),
  applicable_to ENUM('ALL', 'SERVICES', 'PRODUCTS'),
  max_uses INT,
  current_uses INT DEFAULT 0,
  valid_from DATE,
  valid_till DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_code (code)
);
```

---

## Feature Requirements

### **Phase 1: MVP (4-6 weeks)**

#### **Booking System**
- [ ] Service provider signup and profile creation
- [ ] Availability calendar management
- [ ] Service variant creation and pricing
- [ ] Booking creation with automatic slot assignment
- [ ] Booking status tracking (PENDING → CONFIRMED → IN_PROGRESS → COMPLETED)
- [ ] Basic booking cancellation with refund processing
- [ ] Booking history for customers and professionals

#### **Payment Processing**
- [ ] Payment status tracking (SUCCESS, FAILED, REFUNDED)
- [ ] Razorpay webhook integration for payment updates
- [ ] Refund automation based on cancellation time
- [ ] Wallet system (pre-loaded balance)

#### **Product Management**
- [ ] Product CRUD with variants
- [ ] Inventory tracking
- [ ] Basic order creation and status tracking

#### **Reviews & Ratings**
- [ ] Post-service review submission
- [ ] Star rating (1-5 stars)
- [ ] Aggregate rating display

---

### **Phase 2: Enhancement (3-4 weeks)**

#### **Search & Discovery**
- [ ] Full-text search for services and products
- [ ] Category-based browsing
- [ ] Price range and rating filters
- [ ] Most booked / trending services

#### **Notifications**
- [ ] SMS notifications (Twilio) for booking updates
- [ ] Email receipts after completion
- [ ] In-app push notifications
- [ ] Notification event queue

#### **Coupon System**
- [ ] Create promotional codes
- [ ] Apply discount codes to bookings/orders
- [ ] Validate coupon applicability and limits

#### **Real-Time Features**
- [ ] Professional's location tracking during service
- [ ] Real-time booking status update via WebSocket
- [ ] ETA calculation for professional arrival

---

### **Phase 3: Scale (2-3 weeks)**

#### **Advanced Analytics**
- [ ] Revenue dashboards
- [ ] Professional performance metrics
- [ ] Customer analytics

#### **Loyalty Program**
- [ ] Points earning on purchases
- [ ] Points redemption
- [ ] Tier-based rewards

#### **Professional Onboarding**
- [ ] Document upload and verification
- [ ] KYC integration
- [ ] Performance tracking and ratings

---

## Integration Points & Flow Diagrams

### **1. Booking Flow**

```
Customer View Service
        ↓
Select Service Variant
        ↓
Choose DateTime & Location
        ↓
Check Availability (find nearest professional)
        ↓
Confirm Booking
        ↓
Payment Processing (Razorpay)
        ↓
Send Notification to Professional
        ↓
Professional Accepts/Rejects
        ↓
IF Accepted: Service starts at scheduled time
        ↓
Service Completion
        ↓
Customer rates professional
        ↓
Professional gets payment (after deduction)
```

### **2. Product Purchase Flow**

```
Browse Products
        ↓
Add to Cart
        ↓
View Cart & Apply Coupon
        ↓
Checkout
        ↓
Shipping Address & Method Selection
        ↓
Payment Processing
        ↓
Order Confirmation
        ↓
Fulfillment & Delivery
        ↓
Delivery Confirmation
        ↓
Customer Rating & Review
```

### **3. Architecture Layers**

```
┌────────────────────────────────────────────────────────────┐
│                   REST API ENDPOINTS                        │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  Services Routes:          Products Routes:   Other Routes: │
│  ├─ /api/v1/services      ├─ /api/v1/products ├─ /api/v1/... │
│  ├─ /api/v1/bookings      ├─ /api/v1/orders    │            │
│  └─ /api/v1/professionals └─ /api/v1/cart      │            │
│                                                 │            │
├────────────────────────────────────────────────────────────┤
│                   SERVICE LAYER                             │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  BookingService    OrderService    PaymentService           │
│  ├─ createBooking  ├─ createOrder  ├─ processPayment        │
│  ├─ updateStatus   ├─ updateStatus ├─ processRefund        │
│  └─ cancel         └─ getHistory   └─ validateWallet        │
│                                                              │
├────────────────────────────────────────────────────────────┤
│                   MODEL & DATABASE LAYER                    │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  Sequelize Models ↔ PostgreSQL/MySQL                        │
│  Associations defined in /models/associations.js            │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### **Phase 1: Core Booking & Payment (Weeks 1-6)**

**Week 1-2: Database & Models**
- [ ] Design and create all required tables
- [ ] Update `associations.js` with new relationships
- [ ] Create Sequelize models for ServiceProvider, Service, Booking, Product, Order
- [ ] Add migrations using Sequelize CLI

**Week 2-3: Service Provider Management**
- [ ] Create ServiceProvider model and routes
- [ ] Implement professional signup/profile management
- [ ] Availability calendar API
- [ ] Location-based professional search

**Week 3-4: Booking System**
- [ ] Service Catalog APIs (list, filter, variants)
- [ ] Booking creation with slot availability check
- [ ] Professional auto-assignment algorithm
- [ ] Booking status lifecycle management

**Week 4-5: Enhanced Payment**
- [ ] Update payment processing for bookings
- [ ] Implement refund automation
- [ ] Wallet system integration
- [ ] Payment status webhooks

**Week 5-6: Testing & Deployment**
- [ ] Unit tests for booking and payment services
- [ ] Integration testing
- [ ] Production deployment

---

### **Phase 2: Products & E-Commerce (Weeks 7-10)**

**Week 7: Product Management**
- [ ] Product catalog APIs
- [ ] Inventory management
- [ ] Variant creation

**Week 8: Orders & Cart**
- [ ] Cart system (add/remove items)
- [ ] Order creation from cart
- [ ] Order tracking

**Week 9: Notifications & Search**
- [ ] Email/SMS notification service
- [ ] Search implementation (Elasticsearch or simple SQL Full-text search)
- [ ] Filters and facets

**Week 10: Reviews & Coupons**
- [ ] Review submission API
- [ ] Coupon system
- [ ] Aggregate ratings

---

### **Phase 3: Advanced Features (Weeks 11-13)**

**Week 11: Real-time Tracking**
- [ ] WebSocket integration with Socket.io
- [ ] Live location tracking
- [ ] Push notifications

**Week 12: Analytics**
- [ ] Dashboard metrics
- [ ] Event tracking
- [ ] Reports

**Week 13: Optimization & Launch**
- [ ] Performance tuning
- [ ] Load testing
- [ ] Production deployment

---

## Tech Stack & Tools

### **Current Stack (Already in MarkCare)**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL/MySQL with Sequelize ORM
- **Authentication**: JWT, OTP
- **Payments**: Razorpay
- **File Storage**: AWS S3, Cloudinary
- **Real-time**: Socket.io (already installed)
- **Task Queue**: Bull, BullMQ (already installed)
- **Email**: Nodemailer (already installed)
- **SMS**: Twilio (already installed)

### **New Tools to Add**

| Layer | Tool | Purpose |
|-------|------|---------|
| **Search** | Elasticsearch 7.x or Algolia | Full-text search & faceted filtering |
| **Geolocation** | Google Maps API | Distance calculation, location services |
| **Cache** | Redis (already have IORedis) | Session caching, rate limiting |
| **Message Queue** | Bull/RabbitMQ (already have Bull) | Background jobs for notifications |
| **Monitoring** | Sentry / DataDog | Error tracking & performance monitoring |
| **Testing** | Jest + Supertest | Unit & integration testing |

---

## Considerations & Challenges

### **1. Scalability**
- **Challenge**: Real-time location tracking during service can be resource-intensive
- **Solution**: Use Redis pub/sub for efficient message broadcasting

### **2. Availability Matching**
- **Challenge**: Finding available professional slots in real-time
- **Solution**: Pre-fetch available slots, cache in Redis, update every 5 minutes

### **3. Payment & Refunds**
- **Challenge**: Handling refunds with time-based policies
- **Solution**: Automated refund jobs triggered at booking creation with time delay logic

### **4. Multiple Pricing Models**
- **Challenge**: Services (time-based) vs Products (quantity-based)
- **Solution**: Polymorphic payment handling based on reference_type (BOOKING vs ORDER)

### **5. Professional Disputes**
- **Challenge**: Handling complaints, no-shows, cancellations
- **Solution**: Implement dispute resolution workflow with admin intervention

---

## Success Metrics

### **User Adoption**
- Number of service bookings per day
- Number of product orders per day
- Customer repeat booking rate

### **Quality Metrics**
- Average service rating (target: 4.5+/5)
- Average product rating (target: 4.0+/5)
- Cancellation rate (target: <5%)

### **Business Metrics**
- Revenue per booking
- Revenue per order
- Customer acquisition cost (CAC)
- Lifetime value (LTV)

### **Performance Metrics**
- API response time (<200ms p95)
- Payment success rate (>98%)
- Availability match rate (>90% customers find professionals)

---

## Next Steps

1. **Stakeholder Review**: This document needs approval before proceeding
2. **Database Migration**: Create all new tables in staging environment
3. **Proof of Concept**: Build a minimal booking flow (1 service type)
4. **Iterative Development**: Phase-wise rollout with team collaboration
5. **Testing & QA**: Comprehensive testing before each phase release

---

**Document prepared for**: _______________  
**Date**: _______________  
**Approved**: ☐ Yes ☐ No ☐ With Changes

**Comments/Changes Required**:
```
[Space for stakeholder feedback]
```

