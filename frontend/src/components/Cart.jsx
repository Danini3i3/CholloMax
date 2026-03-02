import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

function formatMoney(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchCart = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateItem = async (productId, quantity) => {
    try {
      await api.post('/cart/update', { productId, quantity });
      fetchCart();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo actualizar');
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.post('/cart/remove', { productId });
      fetchCart();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo eliminar');
    }
  };

  const placeOrder = async () => {
    try {
      const { data } = await api.post('/orders/place');
      setMessage(`Pedido confirmado. ID ${data.orderId}. Tus puntos: ${data.newPoints}`);
      fetchCart();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo cerrar el pedido');
    }
  };

  if (loading) {
    return <p>Cargando carrito...</p>;
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Tu carrito</h2>
        <span className="pill">{cart.items.length} items</span>
      </div>

      {cart.items.length === 0 ? (
        <p>
          Tu carrito esta vacio. <Link to="/">Ver productos</Link>
        </p>
      ) : (
        <>
          <div className="cart-list">
            {cart.items.map((item) => (
              <article className="cart-item" key={item.product_id}>
                <img
                  alt={item.name}
                  src={
                    item.image_url ||
                    'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=700&q=80'
                  }
                />
                <div className="cart-item__info">
                  <h3>{item.name}</h3>
                  <p>{formatMoney(item.price)}</p>
                  <small>Stock: {item.stock}</small>
                </div>
                <div className="cart-item__actions">
                  <input
                    max={item.stock}
                    min={0}
                    onChange={(event) => updateItem(item.product_id, Number(event.target.value))}
                    type="number"
                    value={item.quantity}
                  />
                  <button className="btn btn--danger" onClick={() => removeItem(item.product_id)} type="button">
                    Quitar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="checkout-box">
            <h3>Total: {formatMoney(cart.total)}</h3>
            <button className="btn" onClick={placeOrder} type="button">
              Finalizar pedido
            </button>
          </div>
        </>
      )}

      {message && <p className="alert">{message}</p>}
    </section>
  );
}
