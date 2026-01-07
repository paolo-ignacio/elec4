# HealthCart - E-Commerce Healthcare Store

A full-stack e-commerce web application for healthcare products built with Flask (Python) and MySQL.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Features](#features)
7. [API Endpoints](#api-endpoints)
8. [File Structure](#file-structure)
9. [Installation & Setup](#installation--setup)

---

## Project Overview

HealthCart is an e-commerce platform specializing in healthcare products including vitamins, first aid supplies, personal care items, medical devices, and more. The application supports both customer and admin roles with comprehensive order management and payment verification systems.

### Key Features
- User authentication (login/register)
- Product browsing with filtering and search
- Shopping cart management
- Wishlist functionality
- Multi-step checkout with payment proof upload
- Order tracking and history
- Admin dashboard with sales analytics
- Admin product, category, user, and order management
- Payment verification system

---

## Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: MySQL/MariaDB
- **ORM**: Raw SQL with MySQLdb
- **Security**: Flask-WTF (CSRF protection), bcrypt (password hashing)
- **File Uploads**: Werkzeug secure filename handling

### Frontend
- **Templates**: Jinja2
- **Styling**: Custom CSS
- **JavaScript**: Vanilla JS (modular architecture)
- **Charts**: Chart.js (admin dashboard)

---

## Database Schema

### Tables Overview

#### 1. `users`
Stores all user accounts (customers and admins).

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  passwordhash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer') DEFAULT 'customer',
  status ENUM('active', 'deactivated') DEFAULT 'active',
  phone VARCHAR(20),
  address TEXT,
  createdat DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Fields Explained:**
- `role`: Determines access level - 'admin' can access dashboard, 'customer' can shop
- `status`: Account status - 'deactivated' accounts cannot login
- `passwordhash`: bcrypt-hashed password

---

#### 2. `categories`
Product categories for organization.

```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  image_path VARCHAR(255),
  createdat DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Categories include:** Vitamins & Supplements, First Aid & Emergency, Personal Care, Medical Devices, Baby & Maternal Care, Pain Relief, Respiratory Care, Skin Care & Dermatology

---

#### 3. `products`
All products available in the store.

```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL,
  categoryid INT REFERENCES categories(id),
  imagepath VARCHAR(255),
  createdat DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Fields Explained:**
- `stock`: Current inventory count, decremented on order placement
- `imagepath`: Path to product image (stored in `/static/images/`)

---

#### 4. `carts` & `cartitems`
Shopping cart system with many-to-many relationship.

```sql
-- One cart per user
CREATE TABLE carts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userid INT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart items linking cart to products
CREATE TABLE cartitems (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cartid INT REFERENCES carts(id) ON DELETE CASCADE,
  productid INT REFERENCES products(id) ON DELETE CASCADE,
  quantity INT DEFAULT 1
);
```

**Relationship:** User -> Cart (1:1) -> CartItems (1:N) -> Products

---

#### 5. `orders` & `orderitems`
Order management system.

```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userid INT REFERENCES users(id) ON DELETE SET NULL,
  totalamount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled') DEFAULT 'pending',
  cancellation_reason TEXT,
  shippingaddress VARCHAR(200),
  createdat DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE orderitems (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderid INT REFERENCES orders(id) ON DELETE CASCADE,
  productid INT REFERENCES products(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL  -- Snapshot of price at order time
);
```

**Order Status Workflow:**
```
pending -> processing -> shipped -> completed
    |          |
    v          v
cancelled  cancelled
```

**State Transitions (Enforced in Backend):**
- `pending` can go to: `processing`, `cancelled`
- `processing` can go to: `shipped`, `cancelled`
- `shipped` can go to: `completed`
- `completed` and `cancelled` are terminal states

---

#### 6. `payments`
Payment records linked to orders.

```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderid INT REFERENCES orders(id) ON DELETE CASCADE,
  method ENUM('GCash', 'PayPal', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Cash on Delivery') NOT NULL,
  status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  reference_no VARCHAR(100),
  proof_image VARCHAR(255),
  paid_at DATETIME
);
```

**Payment Methods:**
| Method | Requires Proof | Reference Format |
|--------|----------------|------------------|
| GCash | Yes | GCASH-YYYYMMDD-ORDERID |
| PayPal | Yes | PAYPAL-YYYYMMDD-ORDERID |
| Credit Card | Yes | CC-YYYYMMDD-ORDERID |
| Debit Card | Yes | DC-YYYYMMDD-ORDERID |
| Bank Transfer | Yes | BT-YYYYMMDD-ORDERID |
| Cash on Delivery | No | None |

**Payment Status Flow:**
- `pending` -> User uploads proof -> `pending_verification` -> Admin approves -> `paid`
- `pending` -> User uploads proof -> `pending_verification` -> Admin rejects -> `failed`

---

#### 7. `wishlist`
User's saved products for later.

```sql
CREATE TABLE wishlist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userid INT REFERENCES users(id) ON DELETE CASCADE,
  productid INT REFERENCES products(id) ON DELETE CASCADE,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_product (userid, productid)
);
```

---

#### 8. `notifications`
In-app notification system.

```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userid INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',  -- 'info', 'order', 'alert'
  is_read TINYINT(1) DEFAULT 0,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### 9. `contact_messages`
Customer inquiries from contact form.

```sql
CREATE TABLE contact_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Backend Architecture

### Main Application File: `app.py`

#### Configuration
```python
# Flask app initialization
app = Flask(__name__)
app.config["SECRET_KEY"] = "dev-secret-key-change-in-production"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=30)

# MySQL Configuration
app.config["MYSQL_HOST"] = "localhost"
app.config["MYSQL_USER"] = "root"
app.config["MYSQL_PASSWORD"] = ""
app.config["MYSQL_DB"] = "elec4"

# File Upload Configuration
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max
```

---

### Authentication Decorators

#### `@login_required`
```python
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please login to access this page.", "error")
            return redirect(url_for("index"))
        return f(*args, **kwargs)
    return decorated_function
```
**Purpose:** Restricts access to logged-in users only. Used on customer routes like `/shop`.

#### `@admin_required`
```python
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please login to access the admin panel.", "error")
            return redirect(url_for("index"))
        if session.get("user_role") != "admin":
            flash("Access denied. Administrator privileges required.", "error")
            return redirect(url_for("index"))
        return f(*args, **kwargs)
    return decorated_function
```
**Purpose:** Restricts access to admin users. Used on all `/admin/*` and dashboard routes.

---

### Forms (Flask-WTF)

```python
class LoginForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    remember_me = BooleanField("Remember me")

class RegisterForm(FlaskForm):
    name = StringField("Full Name", validators=[DataRequired(), Length(min=2, max=100)])
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired(), Length(min=8)])
    confirm_password = PasswordField("Confirm Password", validators=[EqualTo("password")])

class AdminProductForm(FlaskForm):
    name = StringField("Product Name", validators=[DataRequired()])
    description = TextAreaField("Description")
    price = DecimalField("Price", validators=[NumberRange(min=0.01)])
    stock = IntegerField("Stock", validators=[NumberRange(min=0)])
    categoryid = SelectField("Category", coerce=int)
    image = FileField("Image", validators=[FileAllowed(['jpg', 'png', 'jpeg', 'gif', 'webp'])])

class AdminOrderStatusForm(FlaskForm):
    status = SelectField("Status", choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ])
    reason = TextAreaField("Cancellation Reason")
```

---

### Helper Functions

```python
def get_categories():
    """Fetch all categories ordered by name."""

def get_featured_products(limit=8):
    """Get newest products with category info."""

def get_filtered_products(categories, min_price, max_price, in_stock_only, sort, search):
    """Get products with dynamic filtering and sorting."""

def get_or_create_cart(user_id):
    """Get user's cart or create if doesn't exist."""

def get_cart_items(cart_id):
    """Get all items in cart with product details and subtotals."""

def get_cart_total(cart_id):
    """Calculate total price of all cart items."""

def get_cart_count(cart_id):
    """Get total quantity of items in cart."""

def create_notification(user_id, title, message, notif_type):
    """Create an in-app notification for a user."""

def allowed_file(filename):
    """Check if uploaded file extension is allowed."""
```

---

## Frontend Architecture

### Template Structure

```
templates/
├── base.html              # Base template with common layout
├── index.html             # Landing page (public)
├── shop.html              # Shop page (customers)
├── partials/
│   ├── _cart_sidebar.html     # Sliding cart panel
│   ├── _checkout_modal.html   # Multi-step checkout modal
│   ├── _product_modal.html    # Product detail modal
│   ├── _wishlist_modal.html   # Wishlist panel
│   ├── _orders_modal.html     # Order history modal
│   └── _notifications.html    # Notifications dropdown
└── admin/
    ├── dashboard.html     # Admin dashboard with charts
    ├── products.html      # Product management
    ├── categories.html    # Category management
    ├── orders.html        # Order management
    ├── users.html         # User management
    └── sales_report.html  # Sales analytics
```

---

### JavaScript Modules

The frontend JavaScript is modularized in `static/js/shop/`:

#### `core.js`
Core utility functions and global state.
```javascript
// Global functions
function showToast(message, type) { }      // Display toast notifications
function formatPrice(price) { }            // Format currency as ₱XXX.XX
function updateCartCount(count) { }        // Update cart badge number
```

#### `cart.js`
Shopping cart functionality.
```javascript
async function loadCart() { }              // Fetch cart from /api/cart
async function addToCart(productId, qty) { } // POST to /api/cart/add
async function updateCartItem(itemId, qty) { } // PUT to /api/cart/update
async function removeFromCart(itemId) { }  // DELETE to /api/cart/remove
function renderCart(items) { }             // Render cart HTML
function openCart() { }                    // Show cart sidebar
function closeCart() { }                   // Hide cart sidebar
```

#### `checkout.js`
Multi-step checkout process.
```javascript
function initCheckout() { }                // Initialize checkout listeners
function openCheckout() { }                // Open checkout modal
function handlePaymentMethodChange() { }   // Toggle payment-specific UI
function proceedToPayment() { }            // Move to payment step
async function submitOrder() { }           // POST to /api/checkout
function showProofUploadStep() { }         // Show proof upload for non-COD
async function uploadPaymentProof() { }    // POST to /api/payment/upload-proof
function showOrderSuccess() { }            // Show success message
```

**Checkout Steps:**
1. Shipping Information (address, phone)
2. Payment Method Selection
3. Order Review
4. Payment Proof Upload (for non-COD)
5. Order Confirmation

#### `wishlist.js`
Wishlist management.
```javascript
async function openWishlist() { }          // Open wishlist modal, fetch items
async function toggleWishlist(productId) { } // Add/remove from wishlist
async function moveToCart(productId) { }   // Move item to cart
async function removeFromWishlist(productId) { }
function renderWishlist(items) { }         // Render wishlist HTML
```

#### `orders.js`
Order history display.
```javascript
async function loadOrders() { }            // Fetch from /api/orders
function renderOrders(orders) { }          // Render order cards
function showOrderDetails(orderId) { }     // Show order detail modal
function getStatusBadgeClass(status) { }   // Return CSS class for status
```

#### `notifications.js`
Notification system.
```javascript
async function loadNotifications() { }     // Fetch from /api/notifications
async function markAsRead(notifId) { }     // PUT /api/notifications/read/:id
async function markAllAsRead() { }         // PUT /api/notifications/read-all
function updateNotificationBadge(count) { }
```

#### `product-modal.js`
Product detail modal.
```javascript
async function openProductModal(productId) { } // Fetch product, show modal
function closeProductModal() { }
function handleQuantityChange(delta) { }   // Increment/decrement quantity
```

#### `filters.js`
Product filtering and sorting.
```javascript
function initFilters() { }                 // Initialize filter listeners
function applyFilters() { }                // Collect filters, reload page
function clearFilters() { }                // Reset all filters
```

#### `profile.js`
User profile management.
```javascript
function initProfile() { }                 // Initialize profile dropdown
async function updateProfile(phone, address) { }
function openProfileEdit() { }
```

#### `init.js`
Application initialization.
```javascript
document.addEventListener('DOMContentLoaded', function() {
    initCart();
    initWishlist();
    initNotifications();
    initCheckout();
    initFilters();
    initProfile();
    initProductModal();
});
```

---

## Features

### 1. User Authentication

**Registration (`/register` POST):**
```python
# Password hashing with bcrypt
hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

# Insert user with default role='customer'
cur.execute("INSERT INTO users (name, email, passwordhash) VALUES (%s, %s, %s)")
```

**Login (`/login` POST):**
```python
# Verify password
if bcrypt.checkpw(password.encode("utf-8"), user["passwordhash"].encode("utf-8")):
    # Check if account is active
    if user.get("status") != "active":
        flash("Account is deactivated")
        return redirect(url_for("index"))

    # Set session
    session["user_id"] = user["id"]
    session["user_name"] = user["name"]
    session["user_role"] = user["role"]

    # Remember me - persistent session
    if form.remember_me.data:
        session.permanent = True  # Lasts 30 days
```

---

### 2. Product Browsing & Filtering

**Shop Page (`/shop` GET):**
```python
# URL: /shop?category=1&category=2&min_price=100&max_price=500&in_stock=1&sort=price_asc&search=vitamin

products = get_filtered_products(
    categories=[1, 2],          # Multiple category filter
    min_price=100,              # Minimum price
    max_price=500,              # Maximum price
    in_stock_only=True,         # Only show in-stock items
    sort="price_asc",           # Sorting option
    search="vitamin"            # Search term
)
```

**Sort Options:**
- `newest` - Sort by creation date (newest first)
- `price_asc` - Price low to high
- `price_desc` - Price high to low
- `name_asc` - Alphabetical A-Z
- `name_desc` - Alphabetical Z-A

---

### 3. Shopping Cart

**Add to Cart:**
```javascript
// Frontend
await fetch('/api/cart/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: 1, quantity: 2 })
});
```

```python
# Backend logic
# 1. Check product exists
# 2. Verify stock >= requested quantity
# 3. Check if item already in cart
#    - If yes: Update quantity
#    - If no: Insert new cartitem
# 4. Return updated cart count and total
```

---

### 4. Checkout Process

**Step 1: Collect Order Data**
```javascript
const orderData = {
    payment_method: 'GCash',  // or 'Cash on Delivery', etc.
    shipping_address: '123 Main St, Manila\nPhone: 09171234567'
};
```

**Step 2: Submit Order (`/api/checkout` POST)**
```python
# Backend process:
# 1. Verify cart has items
# 2. Lock products (FOR UPDATE) and verify stock
# 3. Calculate total amount
# 4. Create order record
# 5. Create order items (snapshot prices)
# 6. Decrease product stock
# 7. Create payment record with reference number
# 8. Clear cart
# 9. Create notification for user
# 10. Return order details + requires_proof flag
```

**Step 3: Upload Payment Proof (if non-COD)**
```javascript
const formData = new FormData();
formData.append('payment_id', paymentId);
formData.append('proof_image', file);

await fetch('/api/payment/upload-proof', {
    method: 'POST',
    body: formData
});
```

---

### 5. Admin Dashboard

**Dashboard Statistics (`/dashboard`):**
```python
# Total Revenue (completed orders only)
SELECT SUM(totalamount) FROM orders WHERE status = 'completed'

# Total Orders
SELECT COUNT(*) FROM orders

# Total Customers
SELECT COUNT(*) FROM users WHERE role = 'customer'

# Total Products
SELECT COUNT(*) FROM products

# Sales Chart Data (daily/weekly/monthly)
# - Daily: Mon-Sun for current week
# - Weekly: Week 1-4 for current month
# - Monthly: Jan-Dec for current year
```

---

### 6. Admin Order Management

**View Orders (`/orders`):**
- Filter by status (pending, processing, shipped, completed, cancelled)
- Sort by date or amount
- Pagination (10 per page)

**Order Details Modal:**
- Customer information (name, email, phone)
- Shipping address
- Order items with images
- Payment details (method, status, reference number)
- Payment proof image (if uploaded)

**Update Order Status (`/admin/orders/update_status/<id>` POST):**
```python
# Enforced state transitions
allowed_transitions = {
    'pending': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['completed'],
    'completed': [],
    'cancelled': []
}

# Cancellation requires reason
if new_status == 'cancelled' and not reason:
    return error("Reason required")
```

---

### 7. Payment Verification

**Admin Payment Actions (`/admin/payments/verify/<id>` POST):**

**Approve Payment:**
```python
# 1. Update payment status to 'paid'
# 2. Set paid_at timestamp
# 3. Notify user: "Payment verified"
```

**Reject Payment:**
```python
# 1. Update payment status to 'failed'
# 2. Update order status to 'pending' (user can retry)
# 3. Notify user with rejection reason
```

---

## API Endpoints

### Public Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Landing page |
| POST | `/login` | User login |
| POST | `/register` | User registration |
| GET | `/logout` | Logout |

### Customer Routes (requires `@login_required`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shop` | Shop page with filters |
| GET | `/api/product/<id>` | Get product details |
| GET | `/api/cart` | Get cart contents |
| POST | `/api/cart/add` | Add item to cart |
| PUT | `/api/cart/update` | Update item quantity |
| DELETE | `/api/cart/remove` | Remove item from cart |
| DELETE | `/api/cart/clear` | Clear entire cart |
| POST | `/api/checkout` | Submit order |
| POST | `/api/payment/upload-proof` | Upload payment proof |
| GET | `/api/orders` | Get order history |
| GET | `/api/wishlist` | Get wishlist items |
| POST | `/api/wishlist/add` | Add to wishlist |
| POST | `/api/wishlist/remove` | Remove from wishlist |
| POST | `/api/wishlist/toggle` | Toggle wishlist status |
| POST | `/api/wishlist/move-to-cart` | Move wishlist item to cart |
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/read/<id>` | Mark notification read |
| PUT | `/api/notifications/read-all` | Mark all read |
| POST | `/api/profile/update` | Update user profile |

### Admin Routes (requires `@admin_required`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Admin dashboard |
| GET | `/products` | Product list |
| POST | `/admin/products/add` | Add product |
| GET/POST | `/admin/products/edit/<id>` | Edit product |
| GET | `/admin/products/delete/<id>` | Delete product |
| GET | `/categories` | Category list |
| POST | `/admin/categories/add` | Add category |
| GET/POST | `/admin/categories/edit/<id>` | Edit category |
| GET | `/admin/categories/delete/<id>` | Delete category |
| GET | `/orders` | Order list |
| GET | `/admin/orders/details/<id>` | Get order details JSON |
| POST | `/admin/orders/update_status/<id>` | Update order status |
| POST | `/admin/payments/verify/<id>` | Approve/reject payment |
| GET | `/users` | User list |
| POST | `/admin/users/add` | Add user |
| GET/POST | `/admin/users/edit/<id>` | Edit user |
| GET | `/admin/users/delete/<id>` | Delete user |
| GET | `/salesreport` | Sales report |

---

## File Structure

```
elec4/
├── app.py                    # Main Flask application
├── elec4.sql                 # Database schema and seed data
├── requirements.txt          # Python dependencies
├── README.md                 # This documentation
│
├── static/
│   ├── css/
│   │   ├── style.css         # Landing page styles
│   │   ├── shop.css          # Shop page styles
│   │   └── admin.css         # Admin panel styles
│   │
│   ├── js/
│   │   ├── shop.js           # Legacy shop script
│   │   └── shop/             # Modular JS files
│   │       ├── core.js       # Core utilities
│   │       ├── cart.js       # Cart functionality
│   │       ├── checkout.js   # Checkout process
│   │       ├── wishlist.js   # Wishlist management
│   │       ├── orders.js     # Order history
│   │       ├── notifications.js
│   │       ├── product-modal.js
│   │       ├── filters.js
│   │       ├── profile.js
│   │       └── init.js       # Initialization
│   │
│   ├── images/               # Product images
│   └── uploads/              # User uploaded files (payment proofs)
│
└── templates/
    ├── base.html             # Base template
    ├── index.html            # Landing page
    ├── shop.html             # Shop page
    │
    ├── partials/
    │   ├── _cart_sidebar.html
    │   ├── _checkout_modal.html
    │   ├── _product_modal.html
    │   ├── _wishlist_modal.html
    │   ├── _orders_modal.html
    │   └── _notifications.html
    │
    └── admin/
        ├── dashboard.html
        ├── products.html
        ├── categories.html
        ├── orders.html
        ├── users.html
        └── sales_report.html
```

---

## Installation & Setup

### Prerequisites
- Python 3.8+
- MySQL/MariaDB
- pip (Python package manager)

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd elec4
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Create database**
```sql
CREATE DATABASE elec4;
```

5. **Import database schema**
```bash
mysql -u root elec4 < elec4.sql
```

6. **Configure database connection** (in `app.py`)
```python
app.config["MYSQL_HOST"] = "localhost"
app.config["MYSQL_USER"] = "root"
app.config["MYSQL_PASSWORD"] = ""  # Your MySQL password
app.config["MYSQL_DB"] = "elec4"
```

7. **Run the application**
```bash
python app.py
```

8. **Access the application**
- Customer site: `http://localhost:5000`
- Admin login: Use credentials from database (default: admin@healthcare.com / password123)

---

## Default Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@healthcare.com | password123 | Admin |
| juan@email.com | password123 | Customer |
| maria@email.com | password123 | Customer |

---

## Security Considerations

1. **CSRF Protection**: All forms use Flask-WTF CSRF tokens
2. **Password Hashing**: bcrypt with salt
3. **Session Security**: Server-side sessions with secret key
4. **File Upload**: Filename sanitization with `secure_filename()`
5. **SQL Injection**: Parameterized queries throughout
6. **Access Control**: Role-based decorators for route protection

---

## License

This project is for educational purposes.
