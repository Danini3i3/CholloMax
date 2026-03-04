import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

const PROMO_CODE = 'SOBRETOCHO35';
const PROMO_PERCENT = 35;

function formatMoney(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoOpened, setPromoOpened] = useState(false);
  const [promoActive, setPromoActive] = useState(() => window.localStorage.getItem('promo_sobre_tocho') === '1');
  const [checkoutData, setCheckoutData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    paymentMethod: '',
  });
  const navigate = useNavigate();

  const paymentMethods = [
    { value: 'card', label: 'Card' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'bizum', label: 'Bizum' },
    { value: 'bank_transfer', label: 'Bank transfer' },
  ];

  const subtotal = cart.total || 0;
  const discountAmount = promoActive ? (subtotal * PROMO_PERCENT) / 100 : 0;
  const finalTotal = Math.max(subtotal - discountAmount, 0);

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

  const updateCheckoutData = (field, value) => {
    setCheckoutData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isCheckoutComplete = () =>
    checkoutData.fullName.trim() &&
    checkoutData.email.trim() &&
    checkoutData.phone.trim() &&
    checkoutData.address.trim() &&
    checkoutData.city.trim() &&
    checkoutData.postalCode.trim() &&
    checkoutData.country.trim() &&
    checkoutData.paymentMethod.trim();

  const openEnvelope = () => {
    setPromoOpened(true);
    setPromoActive(true);
    window.localStorage.setItem('promo_sobre_tocho', '1');
    setMessage(`Promo activada: ${PROMO_PERCENT}% de descuento aplicado con ${PROMO_CODE}`);
  };

  const placeOrder = async () => {
    if (!isCheckoutComplete()) {
      setMessage('Completa todos los datos de compra y selecciona un metodo de pago');
      return;
    }

    try {
      const { data } = await api.post('/orders/place', {
        customer: {
          fullName: checkoutData.fullName.trim(),
          email: checkoutData.email.trim(),
          phone: checkoutData.phone.trim(),
          address: checkoutData.address.trim(),
          city: checkoutData.city.trim(),
          postalCode: checkoutData.postalCode.trim(),
          country: checkoutData.country.trim(),
        },
        paymentMethod: checkoutData.paymentMethod.trim(),
        promoCode: promoActive ? PROMO_CODE : '',
      });

      const serverTotal = typeof data.finalTotal === 'number' ? data.finalTotal : finalTotal;
      setMessage(`Pedido confirmado. ID ${data.orderId}. Total pagado: ${formatMoney(serverTotal)}. Puntos: ${data.newPoints}`);
      setCheckoutData({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        paymentMethod: '',
      });
      setCheckoutOpen(false);
      setPromoOpen(false);
      setPromoOpened(false);
      setPromoActive(false);
      window.localStorage.removeItem('promo_sobre_tocho');
      fetchCart();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo cerrar el pedido');
    }
  };

  if (loading) {
    return <p>Cargando carrito...</p>;
  }

  return (
    <section className="panel cart-panel">
      <div className="panel__header">
        <h2>[Cart] Tu carrito</h2>
        <span className="pill">{cart.items.length} items</span>
      </div>

      {cart.items.length > 0 && (
        <button className="promo-banner" onClick={() => setPromoOpen(true)} type="button">
          <span className="promo-banner__tag">PROMO FLASH</span>
          <strong>Abre el sobre secreto: descuento directo del {PROMO_PERCENT}%</strong>
          <small>Click para abrir la promo</small>
        </button>
      )}

      {cart.items.length === 0 ? (
        <p>
          Tu carrito esta vacio. <Link to="/">Ver productos</Link>
        </p>
      ) : (
        <>
          <div className="cart-layout">
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
                    <h3>[Item] {item.name}</h3>
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

            <aside className="checkout-box">
              <h3>[Pay] Resumen de compra</h3>
              <p className="stock">Subtotal: {formatMoney(subtotal)}</p>
              <p className="stock stock--good">Descuento promo: -{formatMoney(discountAmount)}</p>
              <p className="checkout-total">Total final: {formatMoney(finalTotal)}</p>
              {promoActive && <p className="deal-chip deal-chip--hot">Cupon activo: {PROMO_CODE}</p>}
              <button className="btn btn--xl" onClick={() => setCheckoutOpen(true)} type="button">
                Ir al pago
              </button>
            </aside>
          </div>

          {checkoutOpen && (
            <div className="popup-overlay popup-overlay--epic" role="dialog" aria-modal="true">
              <div className="popup-card popup-card--promo checkout-popup">
                <button className="popup-close" onClick={() => setCheckoutOpen(false)} type="button">
                  x
                </button>
                <h3>[Checkout] Finalizar pedido</h3>
                <p className="stock">Total a pagar: {formatMoney(finalTotal)}</p>
                <div className="checkout-form">
                  <input
                    onChange={(event) => updateCheckoutData('fullName', event.target.value)}
                    placeholder="Nombre y apellidos"
                    required
                    type="text"
                    value={checkoutData.fullName}
                  />
                  <input
                    onChange={(event) => updateCheckoutData('email', event.target.value)}
                    placeholder="Email"
                    required
                    type="email"
                    value={checkoutData.email}
                  />
                  <input
                    onChange={(event) => updateCheckoutData('phone', event.target.value)}
                    placeholder="Telefono"
                    required
                    type="tel"
                    value={checkoutData.phone}
                  />
                  <input
                    onChange={(event) => updateCheckoutData('address', event.target.value)}
                    placeholder="Direccion"
                    required
                    type="text"
                    value={checkoutData.address}
                  />
                  <div className="checkout-form__row">
                    <input
                      onChange={(event) => updateCheckoutData('city', event.target.value)}
                      placeholder="Ciudad"
                      required
                      type="text"
                      value={checkoutData.city}
                    />
                    <input
                      onChange={(event) => updateCheckoutData('postalCode', event.target.value)}
                      placeholder="Codigo postal"
                      required
                      type="text"
                      value={checkoutData.postalCode}
                    />
                  </div>
                  <input
                    onChange={(event) => updateCheckoutData('country', event.target.value)}
                    placeholder="Pais"
                    required
                    type="text"
                    value={checkoutData.country}
                  />
                  <select
                    className="select"
                    onChange={(event) => updateCheckoutData('paymentMethod', event.target.value)}
                    required
                    value={checkoutData.paymentMethod}
                  >
                    <option value="">Selecciona metodo de pago</option>
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn--xl" disabled={!isCheckoutComplete()} onClick={placeOrder} type="button">
                    Confirmar pedido
                  </button>
                </div>
              </div>
            </div>
          )}

          {promoOpen && (
            <div className="popup-overlay popup-overlay--epic" role="dialog" aria-modal="true">
              <div className="popup-card promo-popup">
                <button className="popup-close" onClick={() => setPromoOpen(false)} type="button">
                  x
                </button>
                <h3>Sobre sorpresa</h3>
                <p className="stock">Este sobre trae un cupon visible: {PROMO_PERCENT}% OFF.</p>

                <div className={`promo-envelope ${promoOpened ? 'promo-envelope--open' : ''}`}>
                  <div className="promo-envelope__back" />
                  <div className="promo-envelope__paper">
                    <strong>{PROMO_PERCENT}% OFF</strong>
                    <small>{PROMO_CODE}</small>
                  </div>
                  <div className="promo-envelope__front" />
                  <div className="promo-envelope__flap" />
                </div>

                {!promoOpened ? (
                  <button className="btn btn--xl" onClick={openEnvelope} type="button">
                    Abrir sobre
                  </button>
                ) : (
                  <div className="alert alert--success">
                    Descuento tocho activado. Se aplica automaticamente al total del carrito.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {message && <p className="alert">{message}</p>}
    </section>
  );
}
