from flask import Flask, render_template, url_for, redirect, request, flash, session, jsonify,g
from flask_wtf import FlaskForm, CSRFProtect
from wtforms import StringField, PasswordField, SubmitField, TextAreaField, BooleanField, DecimalField, IntegerField, SelectField
from wtforms.validators import DataRequired, Length, Email, EqualTo, Regexp, NumberRange, Optional
from flask_wtf.file import FileField, FileAllowed 
from flask_mysqldb import MySQL
from MySQLdb.cursors import DictCursor
from datetime import timedelta, datetime
from functools import wraps
import os
import math
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
import bcrypt
import os
import uuid



# ================================
# AUTH DECORATOR
# ================================
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please login to access this page.", "error")
            return redirect(url_for("index"))
        return f(*args, **kwargs)
    return decorated_function

app = Flask(__name__)
app.config["SECRET_KEY"] = "dev-secret-key-change-in-production"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=30)
csrf = CSRFProtect(app)

# MySQL Configuration
app.config["MYSQL_HOST"] = "localhost"
app.config["MYSQL_USER"] = "root"
app.config["MYSQL_PASSWORD"] = ""
app.config["MYSQL_DB"] = "elec4"
app.config["MYSQL_CURSORCLASS"] = "DictCursor"

mysql = MySQL(app)

# Upload Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ================================
# FORMS
# ================================
class LoginForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    remember_me = BooleanField("Remember me")
    submit = SubmitField("Login")


class RegisterForm(FlaskForm):
    name = StringField("Full Name", validators=[DataRequired(), Length(min=2, max=100)])
    email = StringField("Email", validators=[DataRequired(), Email()])
    phone = StringField("Phone", validators=[
        Length(max=20),
        Regexp(r'^[0-9+\-\s]*$', message="Invalid phone number format")
    ])
    address = TextAreaField("Address")
    password = PasswordField("Password", validators=[DataRequired(), Length(min=8, message="Password must be at least 8 characters")])
    confirm_password = PasswordField(
        "Confirm Password", validators=[DataRequired(), EqualTo("password", message="Passwords must match")]
    )
    submit = SubmitField("Register")

class AdminLoginForm(FlaskForm):
    email = StringField("Email Address", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    submit = SubmitField("Login to Dashboard")

class AdminProductForm(FlaskForm):
    name = StringField("Product Name", validators=[DataRequired(), Length(max=200)])
    description = TextAreaField("Description")
    price = DecimalField("Price", validators=[
        DataRequired(), 
        NumberRange(min=0.01, message="Price must be a positive number")
    ])
    stock = IntegerField("Stock Quantity", validators=[
        DataRequired(), 
        NumberRange(min=0, message="Stock must be a whole positive number")
    ])
    categoryid = SelectField("Category", coerce=int, validators=[DataRequired()])
    image = FileField("Product Image", validators=[
        Optional(),
        FileAllowed(['jpg', 'png', 'jpeg', 'gif', 'webp'], 'Images only!')
    ])
    submit = SubmitField("Save Product")

class AdminProductAddForm(AdminProductForm):
    image = FileField("Product Image", validators=[
        DataRequired(message="Product image is required."),
        FileAllowed(['jpg', 'png', 'jpeg', 'gif', 'webp'], 'Images only!')
    ])

class AdminCategoryForm(FlaskForm):
    name = StringField("Category Name", validators=[DataRequired(), Length(max=100)])
    image = FileField("Category Icon", validators=[
        DataRequired(message="Product image is required."),
        FileAllowed(['jpg', 'png', 'jpeg', 'gif', 'webp'], 'Images only!')
    ])
    submit = SubmitField("Save Category")


class AdminUserForm(FlaskForm):
    name = StringField("Full Name", validators=[DataRequired(), Length(min=2, max=100)])
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password")  # required only on create
    role = StringField("Role", validators=[DataRequired()])
    status = StringField("Status", validators=[DataRequired()])
    phone = StringField("Phone", validators=[
        Length(max=20),
        Regexp(r'^[0-9+\-\s]*$', message="Invalid phone number format")])
    submit = SubmitField("Save User")

class AdminOrderStatusForm(FlaskForm):
    status = SelectField("Status", choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], validators=[DataRequired()])
    reason = TextAreaField("Reason for Cancellation")






# ================================
# HELPER FUNCTIONS
# ================================
def get_categories():
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("SELECT * FROM categories ORDER BY name")
    categories = cur.fetchall()
    cur.close()
    return categories


def get_featured_products(limit=8):
    cur = mysql.connection.cursor(DictCursor)
    cur.execute(
        """
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.categoryid = c.id
        ORDER BY p.createdat DESC
        LIMIT %s
        """,
        (limit,),
    )
    products = cur.fetchall()
    cur.close()
    return products


def get_all_products():
    """Get all products for landing page."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute(
        """
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.categoryid = c.id
        ORDER BY p.createdat DESC
        """
    )
    products = cur.fetchall()
    cur.close()
    return products


def get_filtered_products(categories=None, min_price=None, max_price=None,
                          in_stock_only=False, sort="newest", search=None):
    """Get products with filtering, sorting, and search."""
    cur = mysql.connection.cursor(DictCursor)

    query = """
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.categoryid = c.id
        WHERE 1=1
    """
    params = []

    # Category filter
    if categories and len(categories) > 0:
        placeholders = ",".join(["%s"] * len(categories))
        query += f" AND p.categoryid IN ({placeholders})"
        params.extend(categories)

    # Price filter
    if min_price is not None:
        query += " AND p.price >= %s"
        params.append(min_price)
    if max_price is not None:
        query += " AND p.price <= %s"
        params.append(max_price)

    # Stock filter
    if in_stock_only:
        query += " AND p.stock > 0"

    # Search filter
    if search:
        query += " AND (p.name LIKE %s OR p.description LIKE %s)"
        search_term = f"%{search}%"
        params.extend([search_term, search_term])

    # Sorting
    sort_options = {
        "newest": "p.createdat DESC",
        "price_asc": "p.price ASC",
        "price_desc": "p.price DESC",
        "name_asc": "p.name ASC",
        "name_desc": "p.name DESC",
    }
    order_by = sort_options.get(sort, "p.createdat DESC")
    query += f" ORDER BY {order_by}"

    cur.execute(query, tuple(params))
    products = cur.fetchall()
    cur.close()
    return products


def get_or_create_cart(user_id):
    """Get user's cart or create one if it doesn't exist."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("SELECT * FROM carts WHERE userid = %s", (user_id,))
    cart = cur.fetchone()

    if not cart:
        cur.execute("INSERT INTO carts (userid) VALUES (%s)", (user_id,))
        mysql.connection.commit()
        cart_id = cur.lastrowid
        cart = {'id': cart_id, 'userid': user_id}

    cur.close()
    return cart


def get_cart_items(cart_id):
    """Get all items in a cart with product details."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT ci.id, ci.productid, ci.quantity,
               p.name, p.price, p.imagepath, p.stock,
               (ci.quantity * p.price) as subtotal
        FROM cartitems ci
        JOIN products p ON ci.productid = p.id
        WHERE ci.cartid = %s
    """, (cart_id,))
    items = cur.fetchall()
    cur.close()
    return items


def get_cart_total(cart_id):
    """Calculate total price of cart."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT COALESCE(SUM(ci.quantity * p.price), 0) as total
        FROM cartitems ci
        JOIN products p ON ci.productid = p.id
        WHERE ci.cartid = %s
    """, (cart_id,))
    result = cur.fetchone()
    cur.close()
    return float(result['total']) if result else 0


def get_cart_count(cart_id):
    """Get total number of items in cart."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT COALESCE(SUM(quantity), 0) as count
        FROM cartitems
        WHERE cartid = %s
    """, (cart_id,))
    result = cur.fetchone()
    cur.close()
    return int(result['count']) if result else 0


# ================================
# ROUTES
# ================================
@app.route("/")
def index():
    login_form = LoginForm()
    register_form = RegisterForm()
    categories = get_categories()
    all_products = get_all_products()
    return render_template(
        "index.html",
        login_form=login_form,
        register_form=register_form,
        categories=categories,
        featured_products=all_products,
    )


@app.route("/shop")
@login_required
def shop():
    # Get filter parameters from query string
    category_ids = request.args.getlist("category")
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    in_stock_only = request.args.get("in_stock") == "1"
    sort = request.args.get("sort", "newest")
    search = request.args.get("search", "").strip()

    # Convert category IDs to integers
    categories_filter = []
    if category_ids:
        categories_filter = [int(c) for c in category_ids if c.isdigit()]

    # Get filtered products
    products = get_filtered_products(
        categories=categories_filter if categories_filter else None,
        min_price=min_price,
        max_price=max_price,
        in_stock_only=in_stock_only,
        sort=sort,
        search=search if search else None,
    )

    # Get all categories for filter sidebar
    categories = get_categories()

    # Get cart count for navbar
    cart = get_or_create_cart(session["user_id"])
    cart_count = get_cart_count(cart["id"])

    return render_template(
        "shop.html",
        products=products,
        categories=categories,
        selected_categories=[str(c) for c in categories_filter],
        min_price=min_price,
        max_price=max_price,
        in_stock_only=in_stock_only,
        sort=sort,
        search=search,
        cart_count=cart_count,
    )


# ================================
# PRODUCT API ROUTES
# ================================
@app.route("/api/product/<int:product_id>", methods=["GET"])
@login_required
@csrf.exempt
def get_product(product_id):
    """Get single product details."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.categoryid = c.id
        WHERE p.id = %s
    """, (product_id,))
    product = cur.fetchone()
    cur.close()

    if not product:
        return jsonify({"success": False, "message": "Product not found"}), 404

    return jsonify({
        "success": True,
        "product": {
            "id": product["id"],
            "name": product["name"],
            "description": product["description"],
            "price": float(product["price"]),
            "stock": product["stock"],
            "imagepath": product["imagepath"],
            "category_name": product["category_name"]
        }
    })


# ================================
# CART API ROUTES
# ================================
@app.route("/api/cart", methods=["GET"])
@login_required
@csrf.exempt
def get_cart():
    """Get current user's cart with items."""
    cart = get_or_create_cart(session["user_id"])
    items = get_cart_items(cart["id"])
    total = get_cart_total(cart["id"])
    count = get_cart_count(cart["id"])

    # Convert Decimal to float for JSON serialization
    items_list = []
    for item in items:
        items_list.append({
            "id": item["id"],
            "productid": item["productid"],
            "name": item["name"],
            "price": float(item["price"]),
            "quantity": item["quantity"],
            "stock": item["stock"],
            "imagepath": item["imagepath"],
            "subtotal": float(item["subtotal"])
        })

    return jsonify({
        "success": True,
        "items": items_list,
        "total": total,
        "count": count
    })


@app.route("/api/cart/add", methods=["POST"])
@login_required
@csrf.exempt
def add_to_cart():
    """Add a product to cart."""
    data = request.get_json()
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if not product_id:
        return jsonify({"success": False, "message": "Product ID required"}), 400

    cur = mysql.connection.cursor(DictCursor)

    # Check if product exists and has stock
    cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
    product = cur.fetchone()

    if not product:
        cur.close()
        return jsonify({"success": False, "message": "Product not found"}), 404

    if product["stock"] < quantity:
        cur.close()
        return jsonify({"success": False, "message": "Not enough stock available"}), 400

    # Get or create cart
    cart = get_or_create_cart(session["user_id"])

    # Check if product already in cart
    cur.execute("""
        SELECT * FROM cartitems
        WHERE cartid = %s AND productid = %s
    """, (cart["id"], product_id))
    existing_item = cur.fetchone()

    if existing_item:
        # Update quantity
        new_quantity = existing_item["quantity"] + quantity
        if new_quantity > product["stock"]:
            cur.close()
            return jsonify({"success": False, "message": "Cannot add more than available stock"}), 400

        cur.execute("""
            UPDATE cartitems SET quantity = %s
            WHERE id = %s
        """, (new_quantity, existing_item["id"]))
    else:
        # Insert new item
        cur.execute("""
            INSERT INTO cartitems (cartid, productid, quantity)
            VALUES (%s, %s, %s)
        """, (cart["id"], product_id, quantity))

    mysql.connection.commit()
    cur.close()

    # Get updated cart info
    total = get_cart_total(cart["id"])
    count = get_cart_count(cart["id"])

    return jsonify({
        "success": True,
        "message": "Added to cart",
        "total": total,
        "count": count
    })


@app.route("/api/cart/update", methods=["PUT"])
@login_required
@csrf.exempt
def update_cart_item():
    """Update quantity of a cart item."""
    data = request.get_json()
    item_id = data.get("item_id")
    quantity = data.get("quantity")

    if not item_id or quantity is None:
        return jsonify({"success": False, "message": "Item ID and quantity required"}), 400

    cur = mysql.connection.cursor(DictCursor)

    # Get cart item with product info
    cur.execute("""
        SELECT ci.*, p.stock
        FROM cartitems ci
        JOIN products p ON ci.productid = p.id
        JOIN carts c ON ci.cartid = c.id
        WHERE ci.id = %s AND c.userid = %s
    """, (item_id, session["user_id"]))
    item = cur.fetchone()

    if not item:
        cur.close()
        return jsonify({"success": False, "message": "Item not found"}), 404

    if quantity <= 0:
        # Remove item
        cur.execute("DELETE FROM cartitems WHERE id = %s", (item_id,))
    elif quantity > item["stock"]:
        cur.close()
        return jsonify({"success": False, "message": "Not enough stock"}), 400
    else:
        # Update quantity
        cur.execute("UPDATE cartitems SET quantity = %s WHERE id = %s", (quantity, item_id))

    mysql.connection.commit()

    # Get updated cart info
    cart = get_or_create_cart(session["user_id"])
    total = get_cart_total(cart["id"])
    count = get_cart_count(cart["id"])

    cur.close()
    return jsonify({
        "success": True,
        "message": "Cart updated",
        "total": total,
        "count": count
    })


@app.route("/api/cart/remove", methods=["DELETE"])
@login_required
@csrf.exempt
def remove_from_cart():
    """Remove an item from cart."""
    data = request.get_json()
    item_id = data.get("item_id")

    if not item_id:
        return jsonify({"success": False, "message": "Item ID required"}), 400

    cur = mysql.connection.cursor(DictCursor)

    # Verify item belongs to user's cart
    cur.execute("""
        SELECT ci.id FROM cartitems ci
        JOIN carts c ON ci.cartid = c.id
        WHERE ci.id = %s AND c.userid = %s
    """, (item_id, session["user_id"]))

    if not cur.fetchone():
        cur.close()
        return jsonify({"success": False, "message": "Item not found"}), 404

    cur.execute("DELETE FROM cartitems WHERE id = %s", (item_id,))
    mysql.connection.commit()

    # Get updated cart info
    cart = get_or_create_cart(session["user_id"])
    total = get_cart_total(cart["id"])
    count = get_cart_count(cart["id"])

    cur.close()
    return jsonify({
        "success": True,
        "message": "Item removed",
        "total": total,
        "count": count
    })


@app.route("/api/cart/clear", methods=["DELETE"])
@login_required
@csrf.exempt
def clear_cart():
    """Clear all items from cart."""
    cart = get_or_create_cart(session["user_id"])

    cur = mysql.connection.cursor(DictCursor)
    cur.execute("DELETE FROM cartitems WHERE cartid = %s", (cart["id"],))
    mysql.connection.commit()
    cur.close()

    return jsonify({
        "success": True,
        "message": "Cart cleared",
        "total": 0,
        "count": 0
    })


# ================================
# CHECKOUT & PAYMENT ROUTES
# ================================
@app.route("/api/checkout", methods=["POST"])
@login_required
@csrf.exempt
def checkout():
    """Process checkout and create order."""
    data = request.form if request.form else request.get_json()
    payment_method = data.get("payment_method")
    shipping_address = data.get("shipping_address")

    if not payment_method:
        return jsonify({"success": False, "message": "Payment method required"}), 400

    if not shipping_address:
        return jsonify({"success": False, "message": "Shipping address required"}), 400

    # Get cart
    cart = get_or_create_cart(session["user_id"])
    items = get_cart_items(cart["id"])

    if not items:
        return jsonify({"success": False, "message": "Cart is empty"}), 400

    cur = mysql.connection.cursor(DictCursor)

    try:
        # Verify stock and calculate total
        total_amount = 0
        for item in items:
            cur.execute("SELECT stock FROM products WHERE id = %s FOR UPDATE", (item["productid"],))
            product = cur.fetchone()
            if product["stock"] < item["quantity"]:
                mysql.connection.rollback()
                return jsonify({
                    "success": False,
                    "message": f"Not enough stock for {item['name']}"
                }), 400
            total_amount += float(item["price"]) * item["quantity"]

        # Determine order status based on payment method
        order_status = "pending" if payment_method == "Cash on Delivery" else "processing"
        payment_status = "pending" if payment_method == "Cash on Delivery" else "pending"

        # Create order
        cur.execute("""
            INSERT INTO orders (userid, totalamount, status, shippingaddress)
            VALUES (%s, %s, %s, %s)
        """, (session["user_id"], total_amount, order_status, shipping_address))
        order_id = cur.lastrowid

        # Create order items and update stock
        for item in items:
            cur.execute("""
                INSERT INTO orderitems (orderid, productid, quantity, price)
                VALUES (%s, %s, %s, %s)
            """, (order_id, item["productid"], item["quantity"], item["price"]))

            # Update stock
            cur.execute("""
                UPDATE products SET stock = stock - %s WHERE id = %s
            """, (item["quantity"], item["productid"]))

        # Create payment record
        reference_no = None
        if payment_method != "Cash on Delivery":
            # Generate reference number with abbreviated method name
            method_abbrev = {
                "GCash": "GCASH",
                "PayPal": "PAYPAL",
                "Credit Card": "CC",
                "Debit Card": "DC",
                "Bank Transfer": "BT"
            }
            abbrev = method_abbrev.get(payment_method, payment_method[:3].upper())
            reference_no = f"{abbrev}-{datetime.now().strftime('%Y%m%d')}-{order_id:06d}"

        cur.execute("""
            INSERT INTO payments (orderid, method, status, reference_no)
            VALUES (%s, %s, %s, %s)
        """, (order_id, payment_method, payment_status, reference_no))
        payment_id = cur.lastrowid

        # Clear cart
        cur.execute("DELETE FROM cartitems WHERE cartid = %s", (cart["id"],))

        mysql.connection.commit()
        cur.close()

        # Create notification for the user
        order_number = f"#{order_id:06d}"
        if payment_method == "Cash on Delivery":
            notif_message = f"Your order {order_number} has been placed. Please prepare ₱{total_amount:.2f} for payment upon delivery."
        else:
            notif_message = f"Your order {order_number} has been placed successfully. Total: ₱{total_amount:.2f}"

        create_notification(
            session["user_id"],
            "Order Placed Successfully!",
            notif_message,
            "order"
        )

        return jsonify({
            "success": True,
            "message": "Order placed successfully!",
            "order_id": order_id,
            "payment_id": payment_id,
            "reference_no": reference_no,
            "total": total_amount,
            "payment_method": payment_method,
            "requires_proof": payment_method in ["GCash", "PayPal", "Credit Card", "Debit Card", "Bank Transfer"]
        })

    except Exception as e:
        mysql.connection.rollback()
        cur.close()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/payment/upload-proof", methods=["POST"])
@login_required
@csrf.exempt
def upload_payment_proof():
    """Upload proof of payment screenshot."""
    if 'proof_image' not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400

    file = request.files['proof_image']
    payment_id = request.form.get('payment_id')

    if not payment_id:
        return jsonify({"success": False, "message": "Payment ID required"}), 400

    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "message": "Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WEBP"}), 400

    # Verify payment belongs to user
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT p.* FROM payments p
        JOIN orders o ON p.orderid = o.id
        WHERE p.id = %s AND o.userid = %s
    """, (payment_id, session["user_id"]))
    payment = cur.fetchone()

    if not payment:
        cur.close()
        return jsonify({"success": False, "message": "Payment not found"}), 404

    # Save file
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(filepath)

    # Update payment record
    relative_path = f"uploads/{unique_filename}"
    cur.execute("""
        UPDATE payments
        SET proof_image = %s, status = 'pending_verification'
        WHERE id = %s
    """, (relative_path, payment_id))
    mysql.connection.commit()
    cur.close()

    return jsonify({
        "success": True,
        "message": "Payment proof uploaded successfully!",
        "image_path": relative_path
    })


@app.route("/api/orders", methods=["GET"])
@login_required
@csrf.exempt
def get_orders():
    """Get user's orders."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT o.*, p.method as payment_method, p.status as payment_status,
               p.reference_no, p.proof_image
        FROM orders o
        LEFT JOIN payments p ON o.id = p.orderid
        WHERE o.userid = %s
        ORDER BY o.createdat DESC
    """, (session["user_id"],))
    orders = cur.fetchall()

    # Get order items for each order
    for order in orders:
        cur.execute("""
            SELECT oi.*, pr.name, pr.imagepath
            FROM orderitems oi
            JOIN products pr ON oi.productid = pr.id
            WHERE oi.orderid = %s
        """, (order["id"],))
        order["items"] = cur.fetchall()

    cur.close()

    # Convert to JSON-serializable format
    orders_list = []
    for order in orders:
        order_dict = {
            "id": order["id"],
            "totalamount": float(order["totalamount"]),
            "status": order["status"],
            "shippingaddress": order["shippingaddress"],
            "createdat": order["createdat"].isoformat() if order["createdat"] else None,
            "cancellation_reason": order["cancellation_reason"],
            "payment_method": order["payment_method"],
            "payment_status": order["payment_status"],
            "reference_no": order["reference_no"],
            "proof_image": order["proof_image"],
            "items": [{
                "name": item["name"],
                "quantity": item["quantity"],
                "price": float(item["price"]),
                "imagepath": item["imagepath"]
            } for item in order["items"]]
        }
        orders_list.append(order_dict)

    return jsonify({"success": True, "orders": orders_list})


@app.route("/api/orders/cancel/<int:order_id>", methods=["POST"])
@login_required
@csrf.exempt
def cancel_user_order(order_id):
    """Cancel an order (user-side). Only pending/processing orders can be cancelled."""
    data = request.get_json() if request.is_json else request.form
    reason = data.get("reason", "").strip()

    if not reason:
        return jsonify({"success": False, "message": "Please provide a reason for cancellation."}), 400

    cur = mysql.connection.cursor(DictCursor)

    # Get the order and verify ownership
    cur.execute("SELECT id, status, userid FROM orders WHERE id = %s", (order_id,))
    order = cur.fetchone()

    if not order:
        cur.close()
        return jsonify({"success": False, "message": "Order not found."}), 404

    # Verify the user owns this order
    if order["userid"] != session["user_id"]:
        cur.close()
        return jsonify({"success": False, "message": "Unauthorized."}), 403

    # Check if order can be cancelled (only pending or processing)
    current_status = order["status"]
    if current_status not in ["pending", "processing"]:
        cur.close()
        return jsonify({
            "success": False,
            "message": f"Cannot cancel order with status '{current_status}'. Only pending or processing orders can be cancelled."
        }), 400

    # Update order status to cancelled
    cur.execute(
        "UPDATE orders SET status = 'cancelled', cancellation_reason = %s WHERE id = %s",
        (reason, order_id)
    )
    mysql.connection.commit()
    cur.close()

    return jsonify({"success": True, "message": "Order cancelled successfully."})


# ================================
# PROFILE API ROUTES
# ================================
@app.route("/api/profile/update", methods=["POST"])
@login_required
@csrf.exempt
def update_profile():
    """Update user profile information."""
    data = request.get_json()
    phone = data.get("phone", "").strip()
    address = data.get("address", "").strip()

    cur = mysql.connection.cursor(DictCursor)

    try:
        # Update user in database
        cur.execute("""
            UPDATE users
            SET phone = %s, address = %s
            WHERE id = %s
        """, (phone, address, session["user_id"]))
        mysql.connection.commit()

        # Update session
        session["user_phone"] = phone
        session["user_address"] = address

        cur.close()
        return jsonify({
            "success": True,
            "message": "Profile updated successfully!"
        })

    except Exception as e:
        mysql.connection.rollback()
        cur.close()
        return jsonify({"success": False, "message": str(e)}), 500


# ================================
# NOTIFICATION API ROUTES
# ================================
@app.route("/api/notifications", methods=["GET"])
@login_required
@csrf.exempt
def get_notifications():
    """Get user's notifications."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT id, title, message, type, is_read, createdat
        FROM notifications
        WHERE userid = %s
        ORDER BY createdat DESC
        LIMIT 20
    """, (session["user_id"],))
    notifications = cur.fetchall()
    cur.close()

    # Convert to JSON-serializable format
    notif_list = []
    for notif in notifications:
        notif_list.append({
            "id": notif["id"],
            "title": notif["title"],
            "message": notif["message"],
            "type": notif["type"],
            "read": notif["is_read"],
            "timestamp": notif["createdat"].isoformat() if notif["createdat"] else None
        })

    return jsonify({"success": True, "notifications": notif_list})


@app.route("/api/notifications/add", methods=["POST"])
@login_required
@csrf.exempt
def add_notification():
    """Add a notification for the current user."""
    data = request.get_json()
    title = data.get("title", "").strip()
    message = data.get("message", "").strip()
    notif_type = data.get("type", "info")

    if not title or not message:
        return jsonify({"success": False, "message": "Title and message required"}), 400

    cur = mysql.connection.cursor(DictCursor)
    try:
        cur.execute("""
            INSERT INTO notifications (userid, title, message, type)
            VALUES (%s, %s, %s, %s)
        """, (session["user_id"], title, message, notif_type))
        mysql.connection.commit()
        notif_id = cur.lastrowid
        cur.close()

        return jsonify({
            "success": True,
            "message": "Notification added",
            "notification_id": notif_id
        })
    except Exception as e:
        mysql.connection.rollback()
        cur.close()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/notifications/read/<int:notif_id>", methods=["PUT"])
@login_required
@csrf.exempt
def mark_notification_read(notif_id):
    """Mark a notification as read."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = %s AND userid = %s
    """, (notif_id, session["user_id"]))
    mysql.connection.commit()
    cur.close()

    return jsonify({"success": True, "message": "Marked as read"})


@app.route("/api/notifications/read-all", methods=["PUT"])
@login_required
@csrf.exempt
def mark_all_notifications_read():
    """Mark all notifications as read."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        UPDATE notifications
        SET is_read = TRUE
        WHERE userid = %s
    """, (session["user_id"],))
    mysql.connection.commit()
    cur.close()

    return jsonify({"success": True, "message": "All marked as read"})


@app.route("/api/notifications/<int:notif_id>", methods=["DELETE"])
@login_required
@csrf.exempt
def delete_notification(notif_id):
    """Delete a notification."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        DELETE FROM notifications
        WHERE id = %s AND userid = %s
    """, (notif_id, session["user_id"]))
    mysql.connection.commit()
    cur.close()

    return jsonify({"success": True, "message": "Notification deleted"})


@app.route("/api/notifications/unread-count", methods=["GET"])
@login_required
@csrf.exempt
def get_unread_count():
    """Get count of unread notifications."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT COUNT(*) as count
        FROM notifications
        WHERE userid = %s AND is_read = FALSE
    """, (session["user_id"],))
    result = cur.fetchone()
    cur.close()

    return jsonify({"success": True, "count": result["count"]})


# Helper function to create notification (for internal use)
def create_notification(user_id, title, message, notif_type="info"):
    """Create a notification for a user."""
    cur = mysql.connection.cursor(DictCursor)
    try:
        cur.execute("""
            INSERT INTO notifications (userid, title, message, type)
            VALUES (%s, %s, %s, %s)
        """, (user_id, title, message, notif_type))
        mysql.connection.commit()
        cur.close()
        return True
    except Exception:
        mysql.connection.rollback()
        cur.close()
        return False


# ================================
# WISHLIST API ROUTES
# ================================
@app.route("/api/wishlist", methods=["GET"])
@login_required
@csrf.exempt
def get_wishlist():
    """Get user's wishlist items."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT w.id, w.productid, w.createdat,
               p.name, p.price, p.stock, p.imagepath, p.description,
               c.name as category_name
        FROM wishlist w
        JOIN products p ON w.productid = p.id
        LEFT JOIN categories c ON p.categoryid = c.id
        WHERE w.userid = %s
        ORDER BY w.createdat DESC
    """, (session["user_id"],))
    items = cur.fetchall()
    cur.close()

    wishlist_items = []
    for item in items:
        wishlist_items.append({
            "id": item["id"],
            "product_id": item["productid"],
            "name": item["name"],
            "price": float(item["price"]),
            "stock": item["stock"],
            "imagepath": item["imagepath"],
            "description": item["description"],
            "category": item["category_name"],
            "added_at": item["createdat"].isoformat() if item["createdat"] else None
        })

    return jsonify({"success": True, "items": wishlist_items})


@app.route("/api/wishlist/add", methods=["POST"])
@login_required
@csrf.exempt
def add_to_wishlist():
    """Add a product to wishlist."""
    data = request.get_json()
    product_id = data.get("product_id")

    if not product_id:
        return jsonify({"success": False, "message": "Product ID required"}), 400

    cur = mysql.connection.cursor(DictCursor)

    # Check if product exists
    cur.execute("SELECT id, name FROM products WHERE id = %s", (product_id,))
    product = cur.fetchone()
    if not product:
        cur.close()
        return jsonify({"success": False, "message": "Product not found"}), 404

    # Check if already in wishlist
    cur.execute("""
        SELECT id FROM wishlist
        WHERE userid = %s AND productid = %s
    """, (session["user_id"], product_id))
    existing = cur.fetchone()

    if existing:
        cur.close()
        return jsonify({"success": False, "message": "Already in wishlist", "in_wishlist": True})

    try:
        cur.execute("""
            INSERT INTO wishlist (userid, productid)
            VALUES (%s, %s)
        """, (session["user_id"], product_id))
        mysql.connection.commit()
        wishlist_id = cur.lastrowid
        cur.close()

        return jsonify({
            "success": True,
            "message": f"{product['name']} added to wishlist!",
            "wishlist_id": wishlist_id
        })
    except Exception as e:
        mysql.connection.rollback()
        cur.close()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/wishlist/remove", methods=["POST"])
@login_required
@csrf.exempt
def remove_from_wishlist():
    """Remove a product from wishlist."""
    data = request.get_json()
    product_id = data.get("product_id")

    if not product_id:
        return jsonify({"success": False, "message": "Product ID required"}), 400

    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        DELETE FROM wishlist
        WHERE userid = %s AND productid = %s
    """, (session["user_id"], product_id))
    mysql.connection.commit()
    affected = cur.rowcount
    cur.close()

    if affected > 0:
        return jsonify({"success": True, "message": "Removed from wishlist"})
    else:
        return jsonify({"success": False, "message": "Item not in wishlist"})


@app.route("/api/wishlist/toggle", methods=["POST"])
@login_required
@csrf.exempt
def toggle_wishlist():
    """Toggle a product in wishlist (add if not exists, remove if exists)."""
    data = request.get_json()
    product_id = data.get("product_id")

    if not product_id:
        return jsonify({"success": False, "message": "Product ID required"}), 400

    cur = mysql.connection.cursor(DictCursor)

    # Check if in wishlist
    cur.execute("""
        SELECT id FROM wishlist
        WHERE userid = %s AND productid = %s
    """, (session["user_id"], product_id))
    existing = cur.fetchone()

    if existing:
        # Remove from wishlist
        cur.execute("""
            DELETE FROM wishlist
            WHERE userid = %s AND productid = %s
        """, (session["user_id"], product_id))
        mysql.connection.commit()
        cur.close()
        return jsonify({
            "success": True,
            "action": "removed",
            "in_wishlist": False,
            "message": "Removed from wishlist"
        })
    else:
        # Add to wishlist
        try:
            cur.execute("""
                INSERT INTO wishlist (userid, productid)
                VALUES (%s, %s)
            """, (session["user_id"], product_id))
            mysql.connection.commit()
            cur.close()
            return jsonify({
                "success": True,
                "action": "added",
                "in_wishlist": True,
                "message": "Added to wishlist!"
            })
        except Exception as e:
            mysql.connection.rollback()
            cur.close()
            return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/wishlist/check/<int:product_id>", methods=["GET"])
@login_required
@csrf.exempt
def check_wishlist(product_id):
    """Check if a product is in the user's wishlist."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT id FROM wishlist
        WHERE userid = %s AND productid = %s
    """, (session["user_id"], product_id))
    existing = cur.fetchone()
    cur.close()

    return jsonify({
        "success": True,
        "in_wishlist": existing is not None
    })


@app.route("/api/wishlist/count", methods=["GET"])
@login_required
@csrf.exempt
def get_wishlist_count():
    """Get count of items in wishlist."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT COUNT(*) as count
        FROM wishlist
        WHERE userid = %s
    """, (session["user_id"],))
    result = cur.fetchone()
    cur.close()

    return jsonify({"success": True, "count": result["count"]})


@app.route("/api/wishlist/move-to-cart", methods=["POST"])
@login_required
@csrf.exempt
def move_wishlist_to_cart():
    """Move a wishlist item to cart."""
    data = request.get_json()
    product_id = data.get("product_id")

    if not product_id:
        return jsonify({"success": False, "message": "Product ID required"}), 400

    cur = mysql.connection.cursor(DictCursor)

    # Check if product exists and has stock
    cur.execute("SELECT id, name, stock FROM products WHERE id = %s", (product_id,))
    product = cur.fetchone()
    if not product:
        cur.close()
        return jsonify({"success": False, "message": "Product not found"}), 404

    if product["stock"] <= 0:
        cur.close()
        return jsonify({"success": False, "message": "Product is out of stock"})

    # Get or create cart
    cur.execute("SELECT id FROM carts WHERE userid = %s", (session["user_id"],))
    cart = cur.fetchone()
    if not cart:
        cur.execute("INSERT INTO carts (userid) VALUES (%s)", (session["user_id"],))
        mysql.connection.commit()
        cart_id = cur.lastrowid
    else:
        cart_id = cart["id"]

    # Check if already in cart
    cur.execute("""
        SELECT id, quantity FROM cartitems
        WHERE cartid = %s AND productid = %s
    """, (cart_id, product_id))
    cart_item = cur.fetchone()

    if cart_item:
        # Increment quantity
        new_qty = cart_item["quantity"] + 1
        cur.execute("""
            UPDATE cartitems SET quantity = %s
            WHERE id = %s
        """, (new_qty, cart_item["id"]))
    else:
        # Add new item
        cur.execute("""
            INSERT INTO cartitems (cartid, productid, quantity)
            VALUES (%s, %s, 1)
        """, (cart_id, product_id))

    # Remove from wishlist
    cur.execute("""
        DELETE FROM wishlist
        WHERE userid = %s AND productid = %s
    """, (session["user_id"], product_id))

    mysql.connection.commit()

    # Get new cart count
    cur.execute("""
        SELECT COALESCE(SUM(quantity), 0) as count
        FROM cartitems WHERE cartid = %s
    """, (cart_id,))
    cart_count = cur.fetchone()["count"]
    cur.close()

    return jsonify({
        "success": True,
        "message": f"{product['name']} moved to cart!",
        "cart_count": cart_count
    })


@app.route("/login", methods=["POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        cur = mysql.connection.cursor(DictCursor)
        cur.execute("SELECT * FROM users WHERE email = %s", (form.email.data,))
        user = cur.fetchone()
        cur.close()

        if user and bcrypt.checkpw(form.password.data.encode("utf-8"), user["passwordhash"].encode("utf-8")):
            # Check account status
            if user.get("status") != "active":
                flash("Account is deactivated. Contact administrator.", "error")
                return redirect(url_for("index"))

            # Set session as permanent if remember me is checked
            session.permanent = bool(form.remember_me.data)

            session["user_id"] = user["id"]
            session["user_name"] = user["name"]
            session["user_email"] = user["email"]
            session["user_role"] = user["role"]
            session["user_phone"] = user.get("phone", "")
            session["user_address"] = user.get("address", "")
            flash(f"Welcome back, {user['name']}!", "success")

            # Redirect admins to dashboard, customers to shop
            if user.get("role") == "admin":
                return redirect(url_for("dashboard"))
            else:
                return redirect(url_for("shop"))
        else:
            flash("Invalid email or password.", "error")

    return redirect(url_for("index"))


@app.route("/register", methods=["POST"])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        cur = mysql.connection.cursor(DictCursor)

        # Check if email already exists
        cur.execute("SELECT id FROM users WHERE email = %s", (form.email.data,))
        if cur.fetchone():
            flash("Email already registered.", "error")
            cur.close()
            return redirect(url_for("index"))

        # Hash password
        hashed_password = bcrypt.hashpw(
            form.password.data.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        # Insert new user
        cur.execute(
            """
            INSERT INTO users (name, email, passwordhash, phone, address)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                form.name.data,
                form.email.data,
                hashed_password,
                form.phone.data,
                form.address.data,
            ),
        )
        mysql.connection.commit()
        cur.close()

        flash("Registration successful! Please login.", "success")

    else:
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"{field}: {error}", "error")

    return redirect(url_for("index"))




@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out.", "success")
    return redirect(url_for("index"))






# ADMIN LOGIN

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 1. Check if user is logged in — redirect to the main index/login page
        if "user_id" not in session:
            flash("Please login to access the admin panel.", "error")
            return redirect(url_for("index"))
        
        # 2. Check if user has admin role
        if session.get("user_role") != "admin":
            flash("Access denied. Administrator privileges required.", "error")
            return redirect(url_for("index"))
            
        return f(*args, **kwargs)
    return decorated_function

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():

    return redirect(url_for('index'))

# ADMIN
# DASHBOARD

@app.route('/dashboard')
@admin_required
def dashboard():
    cur = mysql.connection.cursor()
    period = request.args.get('period', 'monthly')

    # Summary Cards Data (Overall Stats)
    cur.execute("SELECT SUM(totalamount) as total_revenue FROM orders WHERE status = 'completed'")
    total_revenue = cur.fetchone()['total_revenue'] or 0

    cur.execute("SELECT COUNT(id) as total_orders FROM orders")
    total_orders = cur.fetchone()['total_orders'] or 0

    cur.execute("SELECT COUNT(id) as total_customers FROM users WHERE role = 'customer'")
    total_customers = cur.fetchone()['total_customers'] or 0
    
    cur.execute("SELECT COUNT(id) as total_products FROM products")
    total_products = cur.fetchone()['total_products'] or 0

    # Sales Report Data - Generate labels and data in Python
    from datetime import datetime as dt, timedelta
    import calendar

    today = dt.now()
    chart_labels = []
    chart_data = []
    total_orders_count = 0

    if period == 'daily':
        # Daily: Show Mon-Sun for current week
        # Get the start of the current week (Monday)
        start_of_week = today - timedelta(days=today.weekday())
        chart_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

        for i in range(7):
            day_date = start_of_week + timedelta(days=i)
            cur.execute("""
                SELECT COUNT(id) as order_count, COALESCE(SUM(totalamount), 0) as total_sales
                FROM orders
                WHERE DATE(createdat) = %s AND status = 'completed'
            """, (day_date.strftime('%Y-%m-%d'),))
            result = cur.fetchone()
            chart_data.append(float(result['total_sales'] or 0))
            total_orders_count += int(result['order_count'] or 0)

    elif period == 'weekly':
        # Weekly: Show Week 1-4 of current month
        first_day_of_month = today.replace(day=1)

        for week_num in range(1, 5):
            week_start = first_day_of_month + timedelta(weeks=week_num-1)
            week_end = week_start + timedelta(days=6)
            # Don't go beyond current month
            if week_start.month != today.month:
                break
            if week_end.month != today.month:
                week_end = today.replace(day=calendar.monthrange(today.year, today.month)[1])

            chart_labels.append(f'Week {week_num}')
            cur.execute("""
                SELECT COUNT(id) as order_count, COALESCE(SUM(totalamount), 0) as total_sales
                FROM orders
                WHERE DATE(createdat) BETWEEN %s AND %s AND status = 'completed'
            """, (week_start.strftime('%Y-%m-%d'), week_end.strftime('%Y-%m-%d')))
            result = cur.fetchone()
            chart_data.append(float(result['total_sales'] or 0))
            total_orders_count += int(result['order_count'] or 0)

    else:  # monthly
        # Monthly: Show Jan-Dec for current year
        chart_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        for month in range(1, 13):
            cur.execute("""
                SELECT COUNT(id) as order_count, COALESCE(SUM(totalamount), 0) as total_sales
                FROM orders
                WHERE MONTH(createdat) = %s AND YEAR(createdat) = %s AND status = 'completed'
            """, (month, today.year))
            result = cur.fetchone()
            chart_data.append(float(result['total_sales'] or 0))
            total_orders_count += int(result['order_count'] or 0)

    # Calculate summary
    total_sales_sum = sum(chart_data)
    non_zero_count = len([x for x in chart_data if x > 0])
    avg_sales = total_sales_sum / non_zero_count if non_zero_count > 0 else 0

    sales_report_data = {
        'labels': chart_labels,
        'data': chart_data,
        'total_sales': total_sales_sum,
        'avg_sales': avg_sales,
        'total_orders': total_orders_count
    }

    # Recent Orders
    cur.execute("""
        SELECT o.id, u.name as customer_name, o.totalamount, o.status, o.createdat
        FROM orders o
        JOIN users u ON o.userid = u.id
        WHERE o.status = 'pending'
        ORDER BY o.createdat DESC
        LIMIT 5
    """)
    recent_orders = cur.fetchall()

    # Top Selling Products
    cur.execute("""
        SELECT p.name, SUM(oi.quantity) as total_sold
        FROM orderitems oi
        JOIN products p ON oi.productid = p.id
        GROUP BY p.id
        ORDER BY total_sold DESC
        LIMIT 5
    """)
    top_selling_products = cur.fetchall()

    cur.close()

    dashboard_data = {
        'total_revenue': total_revenue,
        'total_orders': total_orders,
        'total_customers': total_customers,
        'total_products': total_products,
        'recent_orders': recent_orders,
        'top_selling_products': top_selling_products,
        'sales_report_data': sales_report_data
    }

    # Period info for display
    from datetime import datetime as dt
    now = dt.now()
    period_info = {
        'current_month': now.strftime('%B %Y'),
        'current_year': now.strftime('%Y')
    }

    return render_template("admin/dashboard.html", data=dashboard_data, active_page='dashboard', period=period, period_info=period_info)

@app.route('/products')
@admin_required
def admin_products():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    offset = (page - 1) * per_page
    search_term = request.args.get('search', '')
    category_filter = request.args.get('category', 'all') # Get category filter

    cur = mysql.connection.cursor()

    # Fetch categories first (needed for filter dropdown AND add/edit form)
    cur.execute("SELECT id, name FROM categories ORDER BY name")
    categories_db = cur.fetchall()

    base_query = """
        FROM products p
        LEFT JOIN categories c ON p.categoryid = c.id
    """
    
    # Build WHERE clauses dynamically
    where_clauses = []
    query_params = []

    if search_term:
        where_clauses.append("(p.name LIKE %s OR p.description LIKE %s)")
        query_params.extend([f"%{search_term}%", f"%{search_term}%"])
    
    if category_filter and category_filter != 'all':
        where_clauses.append("p.categoryid = %s")
        query_params.append(category_filter)

    where_sql = ""
    if where_clauses:
        where_sql = " WHERE " + " AND ".join(where_clauses)

    # Get total number of products for pagination
    count_query = f"SELECT COUNT(p.id) as total {base_query} {where_sql}"
    cur.execute(count_query, tuple(query_params))
    total_products = cur.fetchone()['total']
    total_pages = math.ceil(total_products / per_page)

    # Fetch products for the current page
    select_query = f"""
        SELECT 
            p.id, p.name, p.description, p.price, p.stock, 
            c.name AS category_name 
        {base_query} {where_sql}
        ORDER BY p.id DESC
        LIMIT %s OFFSET %s
    """
    query_params.extend([per_page, offset])
    cur.execute(select_query, tuple(query_params))
    products = cur.fetchall()
    
    cur.close()

    # Prepare the form
    form = AdminProductForm()
    # Populate choices for the SelectField
    form.categoryid.choices = [(c['id'], c['name']) for c in categories_db]

    return render_template(
        "admin/products.html", 
        products=products, 
        categories=categories_db, 
        active_page='products',
        page=page,
        total_pages=total_pages,
        search_term=search_term,
        current_category=category_filter, # Pass current filter to template
        form=form  
    )



@app.route('/admin/products/add', methods=['POST'])
@admin_required
def add_product():
    form = AdminProductAddForm()
    
    # Must repopulate choices for validation to work
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("SELECT id, name FROM categories ORDER BY name")
    categories_db = cur.fetchall()
    form.categoryid.choices = [(c['id'], c['name']) for c in categories_db]

    if form.validate_on_submit():
        name = form.name.data
        description = form.description.data
        price = form.price.data
        stock = form.stock.data
        categoryid = form.categoryid.data
        
        imagepath = None
        if form.image.data:
            file = form.image.data
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            imagepath = filename

        cur.execute(
            """INSERT INTO products (name, description, price, stock, categoryid, imagepath) 
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (name, description, price, stock, categoryid, imagepath)
        )
        mysql.connection.commit()
        cur.close()
        flash("Product added successfully.", "success")
        return jsonify({'success': True})
    
    cur.close()
    return jsonify({'success': False, 'errors': form.errors}), 400

@app.route('/admin/products/edit/<int:product_id>', methods=['GET', 'POST'])
@admin_required
def edit_product(product_id):
    cur = mysql.connection.cursor(DictCursor)
    
    # Fetch categories for choices
    cur.execute("SELECT id, name FROM categories ORDER BY name")
    categories_db = cur.fetchall()
    
    form = AdminProductForm()
    form.categoryid.choices = [(c['id'], c['name']) for c in categories_db]

    if request.method == 'POST':
        if form.validate_on_submit():
            name = form.name.data
            description = form.description.data
            price = form.price.data
            stock = form.stock.data
            categoryid = form.categoryid.data

            image_update_sql = ""
            params = [name, description, price, stock, categoryid]
            
            if form.image.data:
                file = form.image.data
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                image_update_sql = ", imagepath = %s"
                params.append(filename)
            
            params.append(product_id)
            cur.execute(f"""UPDATE products SET name = %s, description = %s, price = %s, stock = %s, categoryid = %s {image_update_sql} 
                            WHERE id = %s""", tuple(params))
            mysql.connection.commit()
            cur.close()
            flash("Product updated successfully.", "success")
            return jsonify({'success': True})
        else:
            cur.close()
            return jsonify({'success': False, 'errors': form.errors}), 400
    
    # GET request - populate form
    cur.execute("SELECT * FROM products WHERE id = %s", [product_id])
    product = cur.fetchone()
    cur.close()
    
    if product:
        # Return JSON for the frontend to populate the modal
        return jsonify({
            'id': product['id'],
            'name': product['name'],
            'description': product['description'],
            'price': float(product['price']),
            'stock': product['stock'],
            'categoryid': product['categoryid'],
            'imagepath': product['imagepath']
        })
    return jsonify({'error': 'Product not found'}), 404

@app.route('/admin/products/delete/<int:product_id>')
@admin_required
def delete_product(product_id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM products WHERE id = %s", [product_id])
    mysql.connection.commit()
    cur.close()
    flash("Product deleted successfully.", "success")
    return redirect(url_for('admin_products'))


# Admin - Orders
@app.route('/orders')
@admin_required
def admin_orders():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    offset = (page - 1) * per_page

    # Get filter and sort parameters
    status_filter = request.args.get('status', 'all')
    sort_by = request.args.get('sort_by', 'date')
    sort_order = request.args.get('order', 'desc')

    cur = mysql.connection.cursor()

    # Build query dynamically
    base_query = "FROM orders o LEFT JOIN users u ON o.userid = u.id"
    where_clauses = []
    query_params = []

    if status_filter and status_filter != 'all':
        where_clauses.append("o.status = %s")
        query_params.append(status_filter)

    where_sql = ""
    if where_clauses:
        where_sql = " WHERE " + " AND ".join(where_clauses)

    # Get total number of orders for pagination
    count_query = "SELECT COUNT(o.id) as total " + base_query + where_sql
    cur.execute(count_query, tuple(query_params))
    total_orders = cur.fetchone()['total']
    total_pages = math.ceil(total_orders / per_page)

    # Determine sorting
    order_column = 'o.createdat'
    if sort_by == 'amount':
        order_column = 'o.totalamount'
    
    valid_sort_order = 'DESC' if sort_order == 'desc' else 'ASC'

    # Fetch orders for the current page with payment info
    select_query = f"""
        SELECT o.id, o.totalamount, o.status, o.createdat, u.name as customer_name, o.cancellation_reason,
               p.id as payment_id, p.method as payment_method, p.status as payment_status,
               p.reference_no, p.proof_image
        FROM orders o
        LEFT JOIN users u ON o.userid = u.id
        LEFT JOIN payments p ON o.id = p.orderid
        {where_sql}
        ORDER BY {order_column} {valid_sort_order}
        LIMIT %s OFFSET %s
    """
    query_params.extend([per_page, offset])
    cur.execute(select_query, tuple(query_params))
    orders = cur.fetchall()
    cur.close()
    form = AdminOrderStatusForm()
    return render_template(
        "admin/orders.html", 
        orders=orders, 
        page=page, 
        total_pages=total_pages,
        current_status=status_filter,
        current_sort_by=sort_by,
        current_sort_order=sort_order,
        active_page='orders',
        form=form 
    )

@app.route('/admin/orders/details/<int:order_id>')
@admin_required
def order_details(order_id):
    cur = mysql.connection.cursor(DictCursor)

    # Fetch order details with payment info
    cur.execute("""
        SELECT o.id, o.totalamount, o.status, o.shippingaddress, o.createdat, o.cancellation_reason,
               u.name as customer_name, u.email, u.phone,
               p.id as payment_id, p.method as payment_method, p.status as payment_status,
               p.reference_no, p.proof_image, p.paid_at
        FROM orders o
        LEFT JOIN users u ON o.userid = u.id
        LEFT JOIN payments p ON o.id = p.orderid
        WHERE o.id = %s
    """, [order_id])
    order = cur.fetchone()

    # Fetch order items with product images
    cur.execute("""
        SELECT oi.quantity, oi.price, pr.name as product_name, pr.imagepath
        FROM orderitems oi
        JOIN products pr ON oi.productid = pr.id
        WHERE oi.orderid = %s
    """, [order_id])
    items = cur.fetchall()

    cur.close()

    if not order:
        return jsonify({'success': False, 'error': 'Order not found'}), 404

    # Format order data
    order_data = {
        'id': order['id'],
        'totalamount': float(order['totalamount']),
        'status': order['status'],
        'shippingaddress': order['shippingaddress'],
        'createdat': order['createdat'].strftime('%Y-%m-%d %H:%M') if order['createdat'] else None,
        'cancellation_reason': order['cancellation_reason'],
        'customer_name': order['customer_name'],
        'customer_email': order['email'],
        'customer_phone': order['phone'],
        'payment_id': order['payment_id'],
        'payment_method': order['payment_method'],
        'payment_status': order['payment_status'],
        'reference_no': order['reference_no'],
        'proof_image': order['proof_image'],
        'paid_at': order['paid_at'].strftime('%Y-%m-%d %H:%M') if order['paid_at'] else None
    }

    # Format items data
    items_data = [{
        'product_name': item['product_name'],
        'quantity': item['quantity'],
        'price': float(item['price']),
        'subtotal': float(item['price']) * item['quantity'],
        'imagepath': item['imagepath']
    } for item in items]

    return jsonify({'success': True, 'order': order_data, 'items': items_data})

@app.route('/admin/orders/update_status/<int:order_id>', methods=['POST'])
@admin_required
def update_order_status(order_id):
    form = AdminOrderStatusForm()
    
    # Allowed next states mapping
    allowed_transitions = {
        'pending': ['processing', 'cancelled'],
        'processing': ['shipped', 'cancelled'],
        'shipped': ['completed'],
        'completed': [],
        'cancelled': []
    }

    # Validate form first (CSRF + basic WTForms checks)
    if form.validate_on_submit():
        new_status = form.status.data
        reason = form.reason.data.strip() if form.reason.data else None

        cur = mysql.connection.cursor(DictCursor)
        cur.execute("SELECT status FROM orders WHERE id = %s", (order_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            return jsonify({'success': False, 'errors': {'order': ['Order not found']}}), 404

        current_status = row['status']

        # No-op if same status
        if new_status == current_status:
            cur.close()
            return jsonify({'success': True, 'message': 'No change'}), 200

        # Check allowed transition
        allowed_next = allowed_transitions.get(current_status, [])
        if new_status not in allowed_next:
            cur.close()
            return jsonify({
                'success': False,
                'errors': {'status': [f"Invalid transition from '{current_status}' to '{new_status}'. Allowed: {', '.join(allowed_next) or 'none'}"]}
            }), 400

        # If cancelling, require reason
        if new_status == 'cancelled' and not reason:
            cur.close()
            return jsonify({'success': False, 'errors': {'reason': ['Reason is required when cancelling an order.']}}), 400

        # Perform update
        if new_status == 'cancelled':
            cur.execute("UPDATE orders SET status = %s, cancellation_reason = %s WHERE id = %s", (new_status, reason, order_id))
        elif new_status == 'completed':
            cur.execute("UPDATE orders SET status = %s, createdat = NOW() WHERE id = %s", (new_status, order_id))
        else:
            cur.execute("UPDATE orders SET status = %s WHERE id = %s", (new_status, order_id))

        mysql.connection.commit()
        cur.close()

        flash("Order status updated successfully.", "success")
        return jsonify({'success': True})

    return jsonify({'success': False, 'errors': form.errors}), 400


@app.route('/admin/payments/verify/<int:payment_id>', methods=['POST'])
@admin_required
@csrf.exempt
def verify_payment(payment_id):
    """Verify or reject a payment."""
    data = request.get_json() if request.is_json else request.form
    action = data.get('action')  # 'approve' or 'reject'
    reject_reason = data.get('reason', '').strip()

    if action not in ['approve', 'reject']:
        return jsonify({'success': False, 'message': 'Invalid action'}), 400

    cur = mysql.connection.cursor(DictCursor)

    # Get payment and order info
    cur.execute("""
        SELECT p.*, o.userid, o.id as order_id
        FROM payments p
        JOIN orders o ON p.orderid = o.id
        WHERE p.id = %s
    """, (payment_id,))
    payment = cur.fetchone()

    if not payment:
        cur.close()
        return jsonify({'success': False, 'message': 'Payment not found'}), 404

    if action == 'approve':
        # Update payment status to 'paid'
        cur.execute("""
            UPDATE payments
            SET status = 'paid', paid_at = NOW()
            WHERE id = %s
        """, (payment_id,))

        # Create notification for user
        create_notification(
            payment['userid'],
            "Payment Verified!",
            f"Your payment for Order #{payment['order_id']:06d} has been verified. Your order is now being processed.",
            "order"
        )

        message = "Payment approved successfully"

    else:  # reject
        if not reject_reason:
            cur.close()
            return jsonify({'success': False, 'message': 'Rejection reason is required'}), 400

        # Update payment status to 'failed'
        cur.execute("""
            UPDATE payments
            SET status = 'failed'
            WHERE id = %s
        """, (payment_id,))

        # Update order status to pending (so user can retry)
        cur.execute("""
            UPDATE orders
            SET status = 'pending'
            WHERE id = %s
        """, (payment['order_id'],))

        # Create notification for user
        create_notification(
            payment['userid'],
            "Payment Rejected",
            f"Your payment for Order #{payment['order_id']:06d} was not verified. Reason: {reject_reason}. Please submit a new payment proof or contact support.",
            "alert"
        )

        message = "Payment rejected"

    mysql.connection.commit()
    cur.close()

    return jsonify({'success': True, 'message': message})


@app.route('/admin/payments/proof/<int:payment_id>')
@admin_required
def get_payment_proof(payment_id):
    """Get payment proof details."""
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT p.*, o.totalamount, o.id as order_id, u.name as customer_name, u.email
        FROM payments p
        JOIN orders o ON p.orderid = o.id
        JOIN users u ON o.userid = u.id
        WHERE p.id = %s
    """, (payment_id,))
    payment = cur.fetchone()
    cur.close()

    if not payment:
        return jsonify({'success': False, 'message': 'Payment not found'}), 404

    return jsonify({
        'success': True,
        'payment': {
            'id': payment['id'],
            'order_id': payment['order_id'],
            'method': payment['method'],
            'status': payment['status'],
            'reference_no': payment['reference_no'],
            'proof_image': payment['proof_image'],
            'total_amount': float(payment['totalamount']),
            'customer_name': payment['customer_name'],
            'customer_email': payment['email']
        }
    })


#Admin - SALes report

@app.route('/salesreport')
@admin_required
# @login_required
def admin_sales_report():
    # if session.get('role') != 'admin':
    #     flash("You do not have permission to access this page.", "error")
    #     return redirect(url_for('index'))

    cur = mysql.connection.cursor()

    # Get filter parameters
    period = request.args.get('period', 'monthly')
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    # Base query for completed orders
    base_query = "FROM orders o JOIN users u ON o.userid = u.id WHERE o.status = 'completed'"
    where_clauses = []
    query_params = []

    # Date filtering logic
    start_date, end_date = None, None
    today = datetime.now()

    if start_date_str and end_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            where_clauses.append("o.createdat BETWEEN %s AND %s")
            query_params.extend([start_date.strftime('%Y-%m-%d 00:00:00'), end_date.strftime('%Y-%m-%d 23:59:59')])
            period = 'custom'
        except ValueError:
            flash("Invalid date format. Please use YYYY-MM-DD.", "error")
    else:
        if period == 'daily':
            start_date = end_date = today
        elif period == 'weekly':
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        elif period == 'monthly':
            start_date = today.replace(day=1)
            end_date = (start_date + timedelta(days=31)).replace(day=1) - timedelta(days=1)
        
        if start_date and end_date:
            where_clauses.append("o.createdat BETWEEN %s AND %s")
            query_params.extend([start_date.strftime('%Y-%m-%d 00:00:00'), end_date.strftime('%Y-%m-%d 23:59:59')])

    where_sql = " AND ".join(where_clauses)
    if where_sql:
        base_query += " AND " + where_sql

    # Fetch orders
    cur.execute(f"SELECT o.id, o.totalamount, o.createdat, u.name as customer_name {base_query} ORDER BY o.createdat DESC", tuple(query_params))
    orders = cur.fetchall()

    # Calculate summary
    cur.execute(f"SELECT COUNT(o.id) as total_orders, SUM(o.totalamount) as total_sales {base_query}", tuple(query_params))
    summary = cur.fetchone()
    
    cur.close()

    return render_template(
        "admin/sales_report.html",
        orders=orders,
        summary=summary,
        period=period,
        start_date=start_date_str or (start_date.strftime('%Y-%m-%d') if start_date else ''),
        end_date=end_date_str or (end_date.strftime('%Y-%m-%d') if end_date else ''),
        active_page='sales_report'
    )




# Admin - Categories
@app.route('/categories')
@admin_required
def admin_categories():
    search_term = request.args.get('search', '')
    cur = mysql.connection.cursor()

    # Build query with search
    where_sql = ""
    query_params = []
    if search_term:
        where_sql = "WHERE c.name LIKE %s"
        query_params.append(f"%{search_term}%")

    cur.execute(f"""
        SELECT c.id, c.name, c.image_path, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.categoryid
        {where_sql}
        GROUP BY c.id, c.name, c.image_path
    """, tuple(query_params))
    categories = cur.fetchall()
    cur.close()
    
    form = AdminCategoryForm() # Instantiate form
    
    return render_template("admin/categories.html", categories=categories, active_page='categories', search_term=search_term, form=form)

@app.route('/admin/categories/add', methods=['POST'])
@admin_required
def add_category():
    form = AdminCategoryForm()
    if form.validate_on_submit():
        name = form.name.data
        image_path = None
        
        if form.image.data:
            file = form.image.data
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            image_path = filename
    
        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO categories (name, image_path) VALUES (%s, %s)", (name, image_path))
        mysql.connection.commit()
        cur.close()
        flash("Category added successfully.", "success")
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'errors': form.errors}), 400

@app.route('/admin/categories/edit/<int:category_id>', methods=['GET', 'POST'])
@admin_required
def edit_category(category_id):
    cur = mysql.connection.cursor()
    
    if request.method == 'POST':
        form = AdminCategoryForm()
        if form.validate_on_submit():
            name = form.name.data
            image_path_update_sql = ""
            params = [name]
            
            if form.image.data:
                file = form.image.data
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                image_path_update_sql = ", image_path = %s"
                params.append(filename)
            
            params.append(category_id)
            cur.execute(f"UPDATE categories SET name = %s {image_path_update_sql} WHERE id = %s", tuple(params))
            mysql.connection.commit()
            cur.close()
            flash("Category updated successfully.", "success")
            return jsonify({'success': True})
        else:
            cur.close()
            return jsonify({'success': False, 'errors': form.errors}), 400
    
    cur.execute("SELECT id, name, image_path FROM categories WHERE id = %s", [category_id])
    category = cur.fetchone()
    cur.close()
    
    if category:
        return jsonify({
            'id': category['id'], 
            'name': category['name'],
            'image_path': category['image_path']
        })
    return jsonify({'error': 'Category not found'}), 404

@app.route('/admin/categories/delete/<int:category_id>')
@admin_required
def delete_category(category_id):
    cur = mysql.connection.cursor()

    # Check if any products are associated with this category
    cur.execute("SELECT COUNT(id) as product_count FROM products WHERE categoryid = %s", [category_id])
    product_count = cur.fetchone()['product_count']

    if product_count > 0:
        # If products exist, flash an error message and redirect
        flash(f"Cannot delete category. It contains {product_count} product(s).", "error")
    else:
        # If no products, proceed with deletion
        cur.execute("DELETE FROM categories WHERE id = %s", [category_id])
        mysql.connection.commit()
        flash("Category deleted successfully.", "success")
    
    cur.close()
    return redirect(url_for('admin_categories'))

# Admin user management
@app.route('/users')
@admin_required
def admin_users():
    search_term = request.args.get('search', '')
    page = int(request.args.get('page', 1))
    per_page = 10
    offset = (page - 1) * per_page

    cur = mysql.connection.cursor(DictCursor)

    where_sql = ""
    query_params = []
    if search_term:
        where_sql = "WHERE name LIKE %s OR email LIKE %s"
        like_term = f"%{search_term}%"
        query_params.extend([like_term, like_term])

    # Count users
    count_query = f"SELECT COUNT(*) as total FROM users {where_sql}"
    cur.execute(count_query, tuple(query_params))
    total_users = cur.fetchone()['total']
    total_pages = max(1, math.ceil(total_users / per_page))

    # Fetch users (include status)
    select_query = f"""
        SELECT id, name, email, role, status, phone, createdat
        FROM users
        {where_sql}
        ORDER BY createdat DESC
        LIMIT %s OFFSET %s
    """
    query_params.extend([per_page, offset])
    cur.execute(select_query, tuple(query_params))
    users = cur.fetchall()
    cur.close()

    # use existing form (with errors) if provided via g, else new
    form = getattr(g, "admin_user_form", AdminUserForm())

    return render_template(
        "admin/users.html",
        users=users,
        active_page='users',
        page=page,
        total_pages=total_pages,
        search_term=search_term,
        form=form,
    )

@app.route('/admin/users/add', methods=['POST'])
@admin_required
def add_user():
    form = AdminUserForm()
    if form.validate_on_submit():
        # Password is required for new users
        if not form.password.data:
             return jsonify({'success': False, 'errors': {'password': ['Password is required.']}}), 400

        name = form.name.data
        email = form.email.data
        password = form.password.data
        role = form.role.data
        status = form.status.data
        phone = form.phone.data

        password_hash = generate_password_hash(password)

        cur = mysql.connection.cursor()
        cur.execute(
            "INSERT INTO users (name, email, passwordhash, role, status, phone) VALUES (%s, %s, %s, %s, %s, %s)",
            (name, email, password_hash, role, status, phone),
        )
        mysql.connection.commit()
        cur.close()
        flash("User added successfully.", "success")
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'errors': form.errors}), 400

@app.route('/admin/users/edit/<int:user_id>', methods=['GET', 'POST'])
@admin_required
def edit_user(user_id):
    cur = mysql.connection.cursor(DictCursor)
    if request.method == 'POST':
        form = AdminUserForm()
        if form.validate_on_submit():
            name = form.name.data
            email = form.email.data
            role = form.role.data
            status = form.status.data
            phone = form.phone.data
            password = form.password.data

            if password:
                password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                cur.execute(
                    "UPDATE users SET name=%s, email=%s, role=%s, status=%s, phone=%s, passwordhash=%s WHERE id=%s",
                    (name, email, role, status, phone, password_hash, user_id),
                )
            else:
                cur.execute(
                    "UPDATE users SET name=%s, email=%s, role=%s, status=%s, phone=%s WHERE id=%s",
                    (name, email, role, status, phone, user_id),
                )
            mysql.connection.commit()
            cur.close()
            flash("User updated successfully.", "success")
            return jsonify({'success': True})
        else:
            cur.close()
            return jsonify({'success': False, 'errors': form.errors}), 400

    # GET: used by AJAX to populate modal
    cur.execute("SELECT id, name, email, role, status, phone FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    cur.close()
    return jsonify(user)
@app.route('/admin/users/delete/<int:user_id>')
@admin_required
def delete_user(user_id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM users WHERE id = %s", [user_id])
    mysql.connection.commit()
    cur.close()
    flash("User deleted successfully.", "success")
    return redirect(url_for('admin_users'))

@app.route('/admin/logout')
def admin_logout():
    session.clear()
    flash("You have been logged out.", "success")
    return redirect(url_for('admin_login'))


if __name__ == "__main__":
    app.run(debug=True)