import sqlite3
import os
from pathlib import Path

if os.getenv("VERCEL"):
    DB_PATH = Path("/tmp/chollomax.db")
else:
    DB_PATH = Path(__file__).parent / "chollomax.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          puntos INTEGER NOT NULL DEFAULT 0,
          fecha_registro TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          category TEXT,
          image_url TEXT
        );

        CREATE TABLE IF NOT EXISTS cart_items (
          user_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          PRIMARY KEY (user_id, product_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          total REAL NOT NULL,
          fecha TEXT NOT NULL,
          estado TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS order_items (
          order_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          PRIMARY KEY (order_id, product_id),
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS historial_juego (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          prize TEXT NOT NULL,
          fecha TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ofertas_flash (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          description TEXT,
          fecha_inicio TEXT,
          fecha_fin TEXT,
          active INTEGER NOT NULL DEFAULT 1
        );
        """
    )

    seed_products(cur)
    seed_flash_offers(cur)

    conn.commit()
    conn.close()


def seed_products(cur):
    count = cur.execute("SELECT COUNT(*) AS total FROM products").fetchone()["total"]
    if count > 0:
        return

    products = [
        (
            "Auriculares NoiseZero Pro",
            "Cancelacion de ruido activa, bateria de 30h y carga rapida USB-C.",
            59.99,
            20,
            "Audio",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
        ),
        (
            "Teclado Mecanico Orion TKL",
            "Switches red, layout compacto y retroiluminacion RGB.",
            79.90,
            15,
            "Perifericos",
            "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=900&q=80",
        ),
        (
            "Monitor 27 165Hz QHD",
            "Panel IPS, 1ms MPRT y compatibilidad FreeSync.",
            249.00,
            8,
            "Monitores",
            "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80",
        ),
        (
            "Silla Gamer ErgoMotion",
            "Respaldo reclinable, soporte lumbar y reposabrazos 4D.",
            189.50,
            10,
            "Mobiliario",
            "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=900&q=80",
        ),
        (
            "SSD NVMe 1TB TurboX",
            "Lectura hasta 7000MB/s para juegos y edicion.",
            99.95,
            30,
            "Almacenamiento",
            "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80",
        ),
    ]

    cur.executemany(
        """
        INSERT INTO products (name, description, price, stock, category, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        products,
    )


def seed_flash_offers(cur):
    count = cur.execute("SELECT COUNT(*) AS total FROM ofertas_flash").fetchone()["total"]
    if count > 0:
        return

    offers = [
        (
            "Flash de Audio",
            "Hasta 30% en auriculares y barras de sonido.",
            "2026-03-01 00:00:00",
            "2026-03-10 23:59:59",
            1,
        ),
        (
            "Semana Setup Pro",
            "Monitores y perifericos con envio express.",
            "2026-03-01 00:00:00",
            "2026-03-15 23:59:59",
            1,
        ),
    ]

    cur.executemany(
        """
        INSERT INTO ofertas_flash (title, description, fecha_inicio, fecha_fin, active)
        VALUES (?, ?, ?, ?, ?)
        """,
        offers,
    )
