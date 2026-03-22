"""
Inventory App - Flask Backend
A simple inventory management API with in-memory storage.
No database required - perfect for learning and demos.
"""

from flask import Flask, render_template, jsonify, request
import uuid

# Initialize Flask app
app = Flask(__name__)

# ─── In-Memory Storage ───────────────────────────────────────
# Simple list to store products (no database needed)
products = [
    {"id": str(uuid.uuid4()), "name": "MacBook Pro", "category": "Electronics", "price": 2499.99, "quantity": 12},
    {"id": str(uuid.uuid4()), "name": "Ergonomic Chair", "category": "Furniture", "price": 349.00, "quantity": 25},
    {"id": str(uuid.uuid4()), "name": "Wireless Mouse", "category": "Accessories", "price": 59.99, "quantity": 150},
]


# ─── Routes ───────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main HTML page."""
    return render_template("index.html")


@app.route("/products", methods=["GET"])
def get_products():
    """Return all products as JSON."""
    return jsonify(products), 200


@app.route("/products", methods=["POST"])
def add_product():
    """Add a new product from JSON body."""
    data = request.get_json()

    # Basic validation
    if not data or not data.get("name"):
        return jsonify({"error": "Product name is required"}), 400

    # Create new product with unique ID
    new_product = {
        "id": str(uuid.uuid4()),
        "name": data.get("name", ""),
        "category": data.get("category", "Uncategorized"),
        "price": float(data.get("price", 0)),
        "quantity": int(data.get("quantity", 0)),
    }

    products.append(new_product)
    return jsonify(new_product), 201


@app.route("/products/<product_id>", methods=["DELETE"])
def delete_product(product_id):
    """Delete a product by its ID."""
    global products
    original_length = len(products)
    products = [p for p in products if p["id"] != product_id]

    if len(products) < original_length:
        return jsonify({"message": "Product deleted"}), 200
    else:
        return jsonify({"error": "Product not found"}), 404


@app.route("/health")
def health():
    """Health check endpoint for CI/CD testing."""
    return jsonify({"status": "healthy", "app": "Inventory App"}), 200


# ─── Run the App ──────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
