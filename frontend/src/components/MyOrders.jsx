import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

function formatMoney(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const loadOrders = async () => {
      try {
        const { data } = await api.get('/orders/my');
        setOrders(data);
      } catch (error) {
        setMessage(error.response?.data?.message || 'No se pudieron cargar tus pedidos');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (loading) return <p>Cargando pedidos...</p>;

  return (
    <section className="content-stack">
      <section className="panel">
        <div className="panel__header">
          <h2>Mis pedidos</h2>
          <span className="pill">{orders.length} pedidos</span>
        </div>
        {orders.length === 0 ? (
          <p>
            Aun no tienes pedidos. <Link to="/">Ver productos</Link>
          </p>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card__head">
                  <div>
                    <h3>Pedido #{order.id}</h3>
                    <p>{new Date(order.fecha).toLocaleString('es-ES')}</p>
                  </div>
                  <div className="order-meta">
                    <span className="deal-chip">{order.estado}</span>
                    <strong>{formatMoney(order.total)}</strong>
                  </div>
                </div>
                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div className="order-item" key={`${order.id}-${item.product_id || index}`}>
                      <img
                        alt={item.product_name || 'Producto'}
                        src={
                          item.image_url ||
                          'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=80'
                        }
                      />
                      <div>
                        <p>{item.product_name || 'Producto eliminado'}</p>
                        <small>
                          {item.quantity} x {formatMoney(item.price)}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {message && <p className="alert alert--error">{message}</p>}
    </section>
  );
}
