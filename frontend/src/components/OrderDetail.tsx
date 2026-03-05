import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

const TRACKING_STAGES = ['Confirmado', 'Preparando', 'Enviado', 'En reparto', 'Entregado'];

function formatMoney(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

function getTrackingData(order, forcedDelivered = false) {
  const orderDate = new Date(order.fecha);
  const now = new Date();
  const elapsedHours = Math.max(0, (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60));
  const estado = String(order.estado || '').toLowerCase();

  let stageIndex = 0;
  if (forcedDelivered) stageIndex = 4;
  else if (estado.includes('cancel')) stageIndex = 0;
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

  return {
    stageIndex,
    progress,
    currentStage: TRACKING_STAGES[stageIndex],
    nextStage,
    etaDate,
    trackingCode,
  };
}

function buildReceiptText(order, tracking) {
  const lines = [];
  lines.push(`Pedido #${order.id}`);
  lines.push(`Fecha: ${new Date(order.fecha).toLocaleString('es-ES')}`);
  lines.push(`Estado: ${tracking.currentStage}`);
  lines.push(`Seguimiento: ${tracking.trackingCode}`);
  lines.push('');
  lines.push('Productos');
  lines.push('---------');
  order.items.forEach((item) => {
    lines.push(`${item.product_name || 'Producto eliminado'} - ${item.quantity} x ${formatMoney(item.price)}`);
  });
  lines.push('');
  lines.push(`Total: ${formatMoney(order.total)}`);
  return lines.join('\n');
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [forcedDelivered, setForcedDelivered] = useState(() => window.localStorage.getItem(`order_received_${id}`) === '1');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const loadOrder = async () => {
      try {
        const { data } = await api.get('/orders/my');
        const found = data.find((item) => String(item.id) === String(id));
        if (!found) {
          setMessage('Pedido no encontrado');
          return;
        }
        setOrder(found);
      } catch (error) {
        setMessage(error.response?.data?.message || 'No se pudo cargar el pedido');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const tracking = useMemo(() => {
    if (!order) return null;
    return getTrackingData(order, forcedDelivered);
  }, [order, forcedDelivered]);

  const repeatOrder = async () => {
    if (!order) return;
    setBusy(true);
    setMessage('');
    let added = 0;
    let failed = 0;

    for (const item of order.items) {
      if (!item.product_id) {
        failed += 1;
        continue;
      }
      try {
        await api.post('/cart/add', { productId: item.product_id, quantity: item.quantity || 1 });
        added += 1;
      } catch (error) {
        failed += 1;
      }
    }

    setBusy(false);
    if (added > 0 && failed === 0) setMessage('Pedido repetido: todos los productos se añadieron al carrito');
    else if (added > 0) setMessage(`Pedido repetido parcialmente: ${added} añadidos, ${failed} no disponibles`);
    else setMessage('No se pudieron añadir productos al carrito');
  };

  const markAsReceived = () => {
    window.localStorage.setItem(`order_received_${id}`, '1');
    setForcedDelivered(true);
    setMessage('Pedido marcado como recibido');
  };

  const downloadSummary = () => {
    if (!order || !tracking) return;
    const content = buildReceiptText(order, tracking);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pedido-${order.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Resumen del pedido descargado');
  };

  if (loading) return <p>Cargando pedido...</p>;
  if (!order) return <p className="alert alert--error">{message || 'Pedido no encontrado'}</p>;

  return (
    <section className="content-stack">
      <section className="panel order-detail-panel">
        <div className="panel__header">
          <h2>Pedido #{order.id}</h2>
          <span className="pill">{tracking.currentStage}</span>
        </div>

        <div className="order-detail-top">
          <p>
            <strong>Fecha:</strong> {new Date(order.fecha).toLocaleString('es-ES')}
          </p>
          <p>
            <strong>Total:</strong> {formatMoney(order.total)}
          </p>
          <p>
            <strong>Tracking:</strong> {tracking.trackingCode}
          </p>
        </div>

        <div className="tracking-box">
          <div className="tracking-box__head">
            <p>
              <strong>Seguimiento en tiempo real</strong>
            </p>
            <span className="pill">{tracking.progress}%</span>
          </div>
          <div className="tracking-progress">
            <div className="tracking-progress__bar" style={{ width: `${tracking.progress}%` }} />
          </div>
          <div className="tracking-stages">
            {TRACKING_STAGES.map((stage, index) => (
              <span className={`tracking-stage ${index <= tracking.stageIndex ? 'tracking-stage--done' : ''}`} key={stage}>
                {stage}
              </span>
            ))}
          </div>
          <div className="tracking-meta">
            <p>
              <strong>Próximo estado:</strong> {tracking.nextStage}
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

        <div className="order-detail-actions">
          <button className="btn btn--xl" disabled={busy} onClick={repeatOrder} type="button">
            {busy ? 'Repitiendo...' : 'Repetir pedido'}
          </button>
          <button className="btn btn--secondary" onClick={downloadSummary} type="button">
            Descargar resumen
          </button>
          <button className="btn btn--ghost" onClick={markAsReceived} type="button">
            Marcar como recibido
          </button>
          <Link className="btn btn--secondary" to="/cart">
            Ir al carrito
          </Link>
          <a className="btn btn--ghost" href={`mailto:soporte@chollomax.local?subject=Incidencia pedido ${order.id}`}>
            Abrir incidencia
          </a>
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

        <div className="actions">
          <Link className="btn btn--ghost" to="/orders">
            Volver a Mis pedidos
          </Link>
        </div>
      </section>

      {message && <p className="alert">{message}</p>}
    </section>
  );
}
