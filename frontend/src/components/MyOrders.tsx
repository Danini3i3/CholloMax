import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

const TRACKING_STAGES = ['Confirmado', 'Preparando', 'Enviado', 'En reparto', 'Entregado'];

function formatMoney(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

function getTrackingData(order) {
  const orderDate = new Date(order.fecha);
  const now = new Date();
  const elapsedHours = Math.max(0, (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60));
  const estado = String(order.estado || '').toLowerCase();

  let stageIndex = 0;
  if (estado.includes('cancel')) stageIndex = 0;
  else if (estado.includes('paid') || estado.includes('pagad')) {
    if (elapsedHours >= 72) stageIndex = 4;
    else if (elapsedHours >= 36) stageIndex = 3;
    else if (elapsedHours >= 18) stageIndex = 2;
    else if (elapsedHours >= 3) stageIndex = 1;
  }

  const progress = Math.round((stageIndex / (TRACKING_STAGES.length - 1)) * 100);
  const etaDate = new Date(orderDate.getTime() + 72 * 60 * 60 * 1000);
  const trackingCode = `CHM-${order.id}-${orderDate.getFullYear()}`;
  const nextStage = stageIndex < TRACKING_STAGES.length - 1 ? TRACKING_STAGES[stageIndex + 1] : 'Entregado';
  const nextUpdate = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  return {
    stageIndex,
    progress,
    currentStage: TRACKING_STAGES[stageIndex],
    nextStage,
    etaDate,
    trackingCode,
    nextUpdate,
  };
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
            Aún no tienes pedidos. <Link to="/">Ver productos</Link>
          </p>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card order-card--tracked" key={order.id}>
                {(() => {
                  const tracking = getTrackingData(order);
                  return (
                    <>
                      <div className="order-card__head">
                        <div>
                          <h3>Pedido #{order.id}</h3>
                          <p>{new Date(order.fecha).toLocaleString('es-ES')}</p>
                        </div>
                        <div className="order-meta">
                          <span className="deal-chip deal-chip--hot">{tracking.currentStage}</span>
                          <strong>{formatMoney(order.total)}</strong>
                          <Link className="btn btn--secondary" to={`/orders/${order.id}`}>
                            Gestionar pedido
                          </Link>
                        </div>
                      </div>

                      <div className="tracking-box">
                        <div className="tracking-box__head">
                          <p>
                            <strong>Seguimiento:</strong> {tracking.trackingCode}
                          </p>
                          <span className="pill">{tracking.progress}%</span>
                        </div>
                        <div className="tracking-progress">
                          <div className="tracking-progress__bar" style={{ width: `${tracking.progress}%` }} />
                        </div>
                        <div className="tracking-stages">
                          {TRACKING_STAGES.map((stage, index) => (
                            <span
                              className={`tracking-stage ${index <= tracking.stageIndex ? 'tracking-stage--done' : ''}`}
                              key={`${order.id}-${stage}`}
                            >
                              {stage}
                            </span>
                          ))}
                        </div>
                        <div className="tracking-meta">
                          <p>
                            <strong>Próximo estado:</strong> {tracking.nextStage}
                          </p>
                          <p>
                            <strong>Próxima actualización:</strong>{' '}
                            {tracking.nextUpdate.toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p>
                            <strong>Entrega estimada:</strong>{' '}
                            {tracking.etaDate.toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
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
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        )}
      </section>

      {message && <p className="alert alert--error">{message}</p>}
    </section>
  );
}
