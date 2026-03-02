# Backend (Flask + SQLite)

## 1) Crear entorno e instalar dependencias

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 2) Configurar variables de entorno

```bash
copy .env.example .env
```

Variables:
- `JWT_SECRET`: secreto para firmar tokens.
- `PORT`: puerto del servidor (por defecto `5000`).

## 3) Ejecutar

```bash
python app.py
```

La API queda disponible en `http://localhost:5000/api`.

## Endpoints principales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/flash/active`
- `GET /api/cart` (auth)
- `POST /api/cart/add` (auth)
- `POST /api/cart/update` (auth)
- `POST /api/cart/remove` (auth)
- `POST /api/orders/place` (auth)
- `GET /api/user/profile` (auth)
- `POST /api/user/redeem` (auth)
- `POST /api/game/spin` (auth)

## Seed de ejemplo

Al arrancar por primera vez:
- se crea `chollomax.db` en `backend/`.
- se insertan productos de ejemplo (audio, monitor, teclado, etc.).
- se insertan ofertas flash activas de ejemplo.
