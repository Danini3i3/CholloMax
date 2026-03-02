import json
import os
import random
import sqlite3
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

try:
    from .db import get_connection, init_db
except ImportError:
    from db import get_connection, init_db

app = Flask(__name__)
CORS(app)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
PORT = int(os.getenv("PORT", "5000"))


def now_str():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def decode_token(token):
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


def issue_token(user_id):
    payload = {
        "id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def auth_required(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"message": "Not authorized, token missing"}), 401

        token = auth.split(" ", 1)[1]
        try:
            data = decode_token(token)
        except Exception:
            return jsonify({"message": "Token invalid or expired"}), 401

        conn = get_connection()
        user = conn.execute(
            "SELECT id, name, email, puntos, fecha_registro FROM users WHERE id = ?",
            (data["id"],),
        ).fetchone()
        conn.close()

        if not user:
            return jsonify({"message": "User not found"}), 401

        g.user = dict(user)
        return handler(*args, **kwargs)

    return wrapper


@app.errorhandler(sqlite3.Error)
def handle_sql_error(err):
    return jsonify({"message": f"Database error: {err}"}), 500


@app.errorhandler(Exception)
def handle_error(err):
    return jsonify({"message": str(err)}), 500


@app.post("/api/auth/register")
def register():
    body = request.get_json(silent=True) or {}
    name = body.get("name", "").strip()
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not name or not email or len(password) < 6:
        return jsonify({"message": "name, email and password(min 6) are required"}), 422

    conn = get_connection()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"message": "Email already in use"}), 400

    hashed = generate_password_hash(password)
    cur = conn.execute(
        """
        INSERT INTO users (name, email, password, puntos, fecha_registro)
        VALUES (?, ?, ?, 0, ?)
        """,
        (name, email, hashed, now_str()),
    )
    conn.commit()
    conn.close()

    token = issue_token(cur.lastrowid)
    return jsonify({"token": token}), 201


@app.post("/api/auth/login")
def login():
    body = request.get_json(silent=True) or {}
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    conn = get_connection()
    user = conn.execute("SELECT id, password FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if not user or not check_password_hash(user["password"], password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = issue_token(user["id"])
    return jsonify({"token": token})


@app.get("/api/products")
def list_products():
    category = request.args.get("category")
    conn = get_connection()

    if category:
        rows = conn.execute(
            "SELECT * FROM products WHERE category = ? ORDER BY id DESC", (category,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM products ORDER BY id DESC").fetchall()

    conn.close()
    return jsonify([dict(r) for r in rows])


@app.get("/api/products/<int:product_id>")
def product_detail(product_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    conn.close()

    if not row:
        return jsonify({"message": "Not found"}), 404
    return jsonify(dict(row))


@app.get("/api/flash/active")
def active_flash():
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT * FROM ofertas_flash
        WHERE active = 1
          AND fecha_inicio <= datetime('now')
          AND fecha_fin >= datetime('now')
        ORDER BY id DESC
        """
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.get("/api/cart")
@auth_required
def get_cart():
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock, p.image_url
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?
        """,
        (g.user["id"],),
    ).fetchall()
    conn.close()

    items = [dict(r) for r in rows]
    total = sum(item["price"] * item["quantity"] for item in items)
    return jsonify({"items": items, "total": total})


@app.post("/api/cart/add")
@auth_required
def add_cart_item():
    body = request.get_json(silent=True) or {}
    product_id = int(body.get("productId", 0))
    quantity = int(body.get("quantity", 0))
    if product_id <= 0 or quantity <= 0:
        return jsonify({"message": "productId and quantity are required"}), 422

    conn = get_connection()
    product = conn.execute(
        "SELECT id, stock FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    if not product:
        conn.close()
        return jsonify({"message": "Product not found"}), 404

    existing = conn.execute(
        "SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
        (g.user["id"], product_id),
    ).fetchone()
    new_qty = quantity + (existing["quantity"] if existing else 0)
    if new_qty > product["stock"]:
        conn.close()
        return jsonify({"message": "Not enough stock"}), 400

    conn.execute(
        """
        INSERT INTO cart_items (user_id, product_id, quantity)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, product_id)
        DO UPDATE SET quantity = excluded.quantity
        """,
        (g.user["id"], product_id, new_qty),
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Added"}), 201


@app.post("/api/cart/update")
@auth_required
def update_cart_item():
    body = request.get_json(silent=True) or {}
    product_id = int(body.get("productId", 0))
    quantity = int(body.get("quantity", 0))
    if product_id <= 0:
        return jsonify({"message": "productId is required"}), 422

    conn = get_connection()
    product = conn.execute(
        "SELECT id, stock FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    if not product:
        conn.close()
        return jsonify({"message": "Product not found"}), 404

    if quantity <= 0:
        conn.execute(
            "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?",
            (g.user["id"], product_id),
        )
    else:
        if quantity > product["stock"]:
            conn.close()
            return jsonify({"message": "Not enough stock"}), 400
        conn.execute(
            """
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, product_id)
            DO UPDATE SET quantity = excluded.quantity
            """,
            (g.user["id"], product_id, quantity),
        )

    conn.commit()
    conn.close()
    return jsonify({"message": "Updated"})


@app.post("/api/cart/remove")
@auth_required
def remove_cart_item():
    body = request.get_json(silent=True) or {}
    product_id = int(body.get("productId", 0))
    if product_id <= 0:
        return jsonify({"message": "productId is required"}), 422

    conn = get_connection()
    conn.execute(
        "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?",
        (g.user["id"], product_id),
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Removed"})


@app.post("/api/orders/place")
@auth_required
def place_order():
    user_id = g.user["id"]
    conn = get_connection()
    items = conn.execute(
        """
        SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?
        """,
        (user_id,),
    ).fetchall()

    if not items:
        conn.close()
        return jsonify({"message": "Cart empty"}), 400

    total = 0.0
    for item in items:
        if item["quantity"] > item["stock"]:
            conn.close()
            return jsonify({"message": f"Not enough stock for {item['name']}"}), 400
        total += item["price"] * item["quantity"]

    cur = conn.execute(
        "INSERT INTO orders (user_id, total, fecha, estado) VALUES (?, ?, ?, ?)",
        (user_id, total, now_str(), "paid"),
    )
    order_id = cur.lastrowid

    for item in items:
        conn.execute(
            """
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES (?, ?, ?, ?)
            """,
            (order_id, item["product_id"], item["quantity"], item["price"]),
        )
        conn.execute(
            "UPDATE products SET stock = stock - ? WHERE id = ?",
            (item["quantity"], item["product_id"]),
        )

    conn.execute("DELETE FROM cart_items WHERE user_id = ?", (user_id,))
    new_points = g.user["puntos"] + int(total)
    conn.execute("UPDATE users SET puntos = ? WHERE id = ?", (new_points, user_id))
    conn.commit()
    conn.close()

    return jsonify({"message": "Order placed", "orderId": order_id, "newPoints": new_points})


@app.get("/api/orders/my")
@auth_required
def my_orders():
    user_id = g.user["id"]
    conn = get_connection()
    orders = conn.execute(
        """
        SELECT id, total, fecha, estado
        FROM orders
        WHERE user_id = ?
        ORDER BY id DESC
        """,
        (user_id,),
    ).fetchall()

    result = []
    for order in orders:
        items = conn.execute(
            """
            SELECT
              oi.product_id,
              oi.quantity,
              oi.price,
              p.name AS product_name,
              p.image_url
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = ?
            """,
            (order["id"],),
        ).fetchall()

        result.append(
            {
                "id": order["id"],
                "total": order["total"],
                "fecha": order["fecha"],
                "estado": order["estado"],
                "items": [dict(item) for item in items],
            }
        )

    conn.close()
    return jsonify(result)


@app.get("/api/user/profile")
@auth_required
def profile():
    return jsonify(g.user)


@app.post("/api/user/redeem")
@auth_required
def redeem_points():
    body = request.get_json(silent=True) or {}
    points = int(body.get("points", 0))
    if points <= 0:
        return jsonify({"message": "Invalid points to redeem"}), 400
    if g.user["puntos"] < points:
        return jsonify({"message": "Not enough points"}), 400

    discount = (points // 100) * 5
    remaining = g.user["puntos"] - points

    conn = get_connection()
    conn.execute("UPDATE users SET puntos = ? WHERE id = ?", (remaining, g.user["id"]))
    conn.commit()
    conn.close()

    return jsonify({"discount": discount, "remainingPoints": remaining})


def random_prize():
    roll = random.random()
    if roll < 0.25:
        return {"type": "points", "amount": 50}
    if roll < 0.5:
        return {"type": "discount", "amount": 10}
    if roll < 0.75:
        return {"type": "shipping", "amount": 0}
    return {"type": "none"}


@app.post("/api/game/spin")
@auth_required
def spin_game():
    user_id = g.user["id"]
    conn = get_connection()

    prize = random_prize()
    conn.execute(
        "INSERT INTO historial_juego (user_id, prize, fecha) VALUES (?, ?, ?)",
        (user_id, json.dumps(prize), now_str()),
    )

    if prize["type"] == "points":
        conn.execute(
            "UPDATE users SET puntos = puntos + ? WHERE id = ?", (prize["amount"], user_id)
        )

    conn.commit()
    conn.close()
    return jsonify({"prize": prize})


@app.post("/api/game/gamble")
@auth_required
def gamble_points():
    body = request.get_json(silent=True) or {}
    try:
        stake = int(body.get("stake", 0))
    except (TypeError, ValueError):
        stake = 0
    choice = body.get("choice", "").strip().lower()

    if stake <= 0:
        return jsonify({"message": "Invalid stake"}), 400
    if choice not in {"red", "black"}:
        return jsonify({"message": "Invalid choice"}), 400

    conn = get_connection()
    user = conn.execute("SELECT id, puntos FROM users WHERE id = ?", (g.user["id"],)).fetchone()
    if not user:
        conn.close()
        return jsonify({"message": "User not found"}), 404
    if user["puntos"] < stake:
        conn.close()
        return jsonify({"message": "Not enough points"}), 400

    rolled = random.choice(["red", "black"])
    won = rolled == choice
    delta = stake if won else -stake
    new_points = user["puntos"] + delta

    conn.execute("UPDATE users SET puntos = ? WHERE id = ?", (new_points, user["id"]))
    conn.execute(
        "INSERT INTO historial_juego (user_id, prize, fecha) VALUES (?, ?, ?)",
        (
            user["id"],
            json.dumps(
                {"type": "gamble", "stake": stake, "choice": choice, "rolled": rolled, "won": won}
            ),
            now_str(),
        ),
    )
    conn.commit()
    conn.close()

    return jsonify(
        {
            "result": "win" if won else "lose",
            "rolled": rolled,
            "delta": delta,
            "newPoints": new_points,
        }
    )


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=PORT, debug=True)
