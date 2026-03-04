import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

const PROMO_CODE = 'SOBRETOCHO35';
const PROMO_PERCENT = 35;
const CHECKOUT_STEPS = ['contact', 'shipping', 'payment'];

const PAYMENT_METHODS = [
  { value: 'card', label: 'Tarjeta', hint: 'Visa, Mastercard y debito', chip: 'FAST' },
  { value: 'paypal', label: 'PayPal', hint: 'Pago seguro con cuenta PayPal', chip: 'SAFE' },
  { value: 'bizum', label: 'Bizum', hint: 'Confirmacion inmediata desde movil', chip: 'MOBILE' },
  { value: 'bank_transfer', label: 'Transferencia', hint: 'Confirmacion bancaria en 24/48h', chip: 'BANK' },
];

const SHIPPING_METHODS = [
  { value: 'standard', label: 'Standard 48h', eta: 'Entrega estimada en 2 dias' },
  { value: 'express', label: 'Express 24h', eta: 'Entrega estimada en 24 horas' },
  { value: 'pickup', label: 'Recogida en punto', eta: 'Recoge hoy en tienda asociada' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d\s()-]{7,20}$/;
const POSTAL_REGEX = /^[A-Za-z0-9\s-]{4,10}$/;

function formatMoney(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

function getValidationErrors(data) {
  const errors = {};

  if (!data.fullName.trim()) errors.fullName = 'Nombre y apellidos obligatorios';
  if (!data.email.trim()) errors.email = 'Email obligatorio';
  else if (!EMAIL_REGEX.test(data.email.trim())) errors.email = 'Email no valido';

  if (!data.phone.trim()) errors.phone = 'Telefono obligatorio';
  else if (!PHONE_REGEX.test(data.phone.trim())) errors.phone = 'Telefono no valido';

  if (!data.address.trim()) errors.address = 'Direccion obligatoria';
  if (!data.city.trim()) errors.city = 'Ciudad obligatoria';

  if (!data.postalCode.trim()) errors.postalCode = 'Codigo postal obligatorio';
  else if (!POSTAL_REGEX.test(data.postalCode.trim())) errors.postalCode = 'Codigo postal no valido';

  if (!data.country.trim()) errors.country = 'Pais obligatorio';
  if (!data.shippingMethod.trim()) errors.shippingMethod = 'Selecciona un envio';
  if (!data.paymentMethod.trim()) errors.paymentMethod = 'Selecciona un metodo de pago';
  if (!data.acceptTerms) errors.acceptTerms = 'Debes aceptar terminos y condiciones';

  return errors;
}

function isStepValid(step, errors) {
  if (step === 'contact') {
    return !errors.fullName && !errors.email && !errors.phone;
  }

  if (step === 'shipping') {
    return !errors.address && !errors.city && !errors.postalCode && !errors.country && !errors.shippingMethod;
  }

  return !errors.paymentMethod && !errors.acceptTerms;
}

function getStepLabel(step) {
  if (step === 'contact') return 'Contacto';
  if (step === 'shipping') return 'Envio';
  return 'Pago';
}

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoOpened, setPromoOpened] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutAttempted, setCheckoutAttempted] = useState(false);
  const [promoActive, setPromoActive] = useState(() => window.localStorage.getItem('promo_sobre_tocho') === '1');
  const [checkoutData, setCheckoutData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    shippingMethod: 'standard',
    paymentMethod: '',
    acceptTerms: false,
    marketingOptIn: false,
  });
  const navigate = useNavigate();

  const subtotal = cart.total || 0;
  const discountAmount = promoActive ? (subtotal * PROMO_PERCENT) / 100 : 0;
  const finalTotal = Math.max(subtotal - discountAmount, 0);
  const currentStep = CHECKOUT_STEPS[stepIndex];
  const validationErrors = getValidationErrors(checkoutData);
  const stepCompletion = CHECKOUT_STEPS.map((step) => isStepValid(step, validationErrors));
  const progress = Math.round(((stepIndex + 1) / CHECKOUT_STEPS.length) * 100);

  const selectedShipping = useMemo(
    () => SHIPPING_METHODS.find((method) => method.value === checkoutData.shippingMethod) || SHIPPING_METHODS[0],
    [checkoutData.shippingMethod]
  );

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
    const safeQuantity = Number.isFinite(quantity) ? quantity : 1;
    const normalizedQuantity = Math.max(0, safeQuantity);

    try {
      await api.post('/cart/update', { productId, quantity: normalizedQuantity });
      await fetchCart();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo actualizar');
    }
  };

  const changeItemQuantity = (item, delta) => {
    const nextQuantity = Math.max(0, Math.min(item.stock, item.quantity + delta));
    if (nextQuantity === item.quantity) return;
    updateItem(item.product_id, nextQuantity);
  };

  const removeItem = async (productId) => {
    try {
      await api.post('/cart/remove', { productId });
      await fetchCart();
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

  const resetCheckout = () => {
    setStepIndex(0);
    setCheckoutAttempted(false);
    setSubmitting(false);
    setCheckoutData({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
      shippingMethod: 'standard',
      paymentMethod: '',
      acceptTerms: false,
      marketingOptIn: false,
    });
  };

  const openEnvelope = () => {
    setPromoOpened(true);
    setPromoActive(true);
    window.localStorage.setItem('promo_sobre_tocho', '1');
    setMessage(`Promo activada: ${PROMO_PERCENT}% de descuento aplicado con ${PROMO_CODE}`);
  };

  const closeCheckout = () => {
    setCheckoutOpen(false);
    setStepIndex(0);
    setCheckoutAttempted(false);
  };

  const moveToNextStep = () => {
    if (!isStepValid(currentStep, validationErrors)) {
      setCheckoutAttempted(true);
      setMessage('Revisa los campos de este paso para continuar');
      return;
    }

    setCheckoutAttempted(false);
    setStepIndex((prev) => Math.min(prev + 1, CHECKOUT_STEPS.length - 1));
  };

  const placeOrder = async () => {
    setCheckoutAttempted(true);
    const allValid = CHECKOUT_STEPS.every((step) => isStepValid(step, validationErrors));
    if (!allValid) {
      setMessage('Completa todos los datos de checkout antes de confirmar el pedido');
      return;
    }

    try {
      setSubmitting(true);
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
      resetCheckout();
      setCheckoutOpen(false);
      setPromoOpen(false);
      setPromoOpened(false);
      setPromoActive(false);
      window.localStorage.removeItem('promo_sobre_tocho');
      await fetchCart();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo cerrar el pedido');
    } finally {
      setSubmitting(false);
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
                  <div className="cart-item__actions cart-item__actions--inline">
                    <div className="qty-control">
                      <button className="btn btn--ghost qty-btn" onClick={() => changeItemQuantity(item, -1)} type="button">
                        -
                      </button>
                      <input
                        max={item.stock}
                        min={0}
                        onChange={(event) => updateItem(item.product_id, Number(event.target.value))}
                        type="number"
                        value={item.quantity}
                      />
                      <button className="btn btn--ghost qty-btn" onClick={() => changeItemQuantity(item, 1)} type="button">
                        +
                      </button>
                    </div>
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
              <p className="stock">Envio: Gratis</p>
              <p className="checkout-total">Total final: {formatMoney(finalTotal)}</p>
              <p className="stock">Metodo de envio: {selectedShipping.label}</p>
              {promoActive && <p className="deal-chip deal-chip--hot">Cupon activo: {PROMO_CODE}</p>}
              <button className="btn btn--xl" onClick={() => setCheckoutOpen(true)} type="button">
                Finalizar checkout
              </button>
            </aside>
          </div>

          {checkoutOpen && (
            <div className="popup-overlay popup-overlay--epic" role="dialog" aria-modal="true">
              <div className="popup-card popup-card--promo checkout-popup checkout-popup--wide">
                <button className="popup-close" onClick={closeCheckout} type="button">
                  x
                </button>
                <h3>[Checkout] Finalizar pedido</h3>
                <p className="stock">Paso {stepIndex + 1} de {CHECKOUT_STEPS.length}: {getStepLabel(currentStep)}</p>
                <div className="checkout-progress">
                  <div className="checkout-progress__bar" style={{ width: `${progress}%` }} />
                </div>

                <div className="checkout-steps">
                  {CHECKOUT_STEPS.map((step, index) => (
                    <button
                      className={`checkout-step ${stepIndex === index ? 'checkout-step--active' : ''} ${
                        stepCompletion[index] ? 'checkout-step--done' : ''
                      }`}
                      key={step}
                      onClick={() => setStepIndex(index)}
                      type="button"
                    >
                      {index + 1}. {getStepLabel(step)}
                    </button>
                  ))}
                </div>

                <div className="checkout-modal-layout">
                  <div className="checkout-form">
                    {currentStep === 'contact' && (
                      <>
                        <h4>Datos de contacto</h4>
                        <input
                          onChange={(event) => updateCheckoutData('fullName', event.target.value)}
                          placeholder="Nombre y apellidos"
                          type="text"
                          value={checkoutData.fullName}
                        />
                        {checkoutAttempted && validationErrors.fullName && (
                          <p className="input-error">{validationErrors.fullName}</p>
                        )}
                        <input
                          onChange={(event) => updateCheckoutData('email', event.target.value)}
                          placeholder="Email"
                          type="email"
                          value={checkoutData.email}
                        />
                        {checkoutAttempted && validationErrors.email && <p className="input-error">{validationErrors.email}</p>}
                        <input
                          onChange={(event) => updateCheckoutData('phone', event.target.value)}
                          placeholder="Telefono"
                          type="tel"
                          value={checkoutData.phone}
                        />
                        {checkoutAttempted && validationErrors.phone && <p className="input-error">{validationErrors.phone}</p>}
                      </>
                    )}

                    {currentStep === 'shipping' && (
                      <>
                        <h4>Direccion y envio</h4>
                        <input
                          onChange={(event) => updateCheckoutData('address', event.target.value)}
                          placeholder="Direccion"
                          type="text"
                          value={checkoutData.address}
                        />
                        {checkoutAttempted && validationErrors.address && (
                          <p className="input-error">{validationErrors.address}</p>
                        )}
                        <div className="checkout-form__row">
                          <input
                            onChange={(event) => updateCheckoutData('city', event.target.value)}
                            placeholder="Ciudad"
                            type="text"
                            value={checkoutData.city}
                          />
                          <input
                            onChange={(event) => updateCheckoutData('postalCode', event.target.value)}
                            placeholder="Codigo postal"
                            type="text"
                            value={checkoutData.postalCode}
                          />
                        </div>
                        {checkoutAttempted && validationErrors.city && <p className="input-error">{validationErrors.city}</p>}
                        {checkoutAttempted && validationErrors.postalCode && (
                          <p className="input-error">{validationErrors.postalCode}</p>
                        )}
                        <input
                          onChange={(event) => updateCheckoutData('country', event.target.value)}
                          placeholder="Pais"
                          type="text"
                          value={checkoutData.country}
                        />
                        {checkoutAttempted && validationErrors.country && <p className="input-error">{validationErrors.country}</p>}

                        <div className="shipping-options">
                          {SHIPPING_METHODS.map((method) => (
                            <label className="shipping-option" key={method.value}>
                              <input
                                checked={checkoutData.shippingMethod === method.value}
                                onChange={(event) => updateCheckoutData('shippingMethod', event.target.value)}
                                type="radio"
                                value={method.value}
                              />
                              <span>
                                <strong>{method.label}</strong>
                                <small>{method.eta}</small>
                              </span>
                            </label>
                          ))}
                        </div>
                        {checkoutAttempted && validationErrors.shippingMethod && (
                          <p className="input-error">{validationErrors.shippingMethod}</p>
                        )}
                      </>
                    )}

                    {currentStep === 'payment' && (
                      <>
                        <h4>Pago y confirmacion</h4>
                        <div className="payment-options" role="radiogroup" aria-label="Metodo de pago">
                          {PAYMENT_METHODS.map((method) => {
                            const isSelected = checkoutData.paymentMethod === method.value;
                            return (
                              <label className={`payment-option ${isSelected ? 'payment-option--active' : ''}`} key={method.value}>
                                <input
                                  checked={isSelected}
                                  name="paymentMethod"
                                  onChange={(event) => updateCheckoutData('paymentMethod', event.target.value)}
                                  type="radio"
                                  value={method.value}
                                />
                                <span className="payment-option__content">
                                  <strong>{method.label}</strong>
                                  <small>{method.hint}</small>
                                </span>
                                <span className="payment-option__chip">{method.chip}</span>
                              </label>
                            );
                          })}
                        </div>
                        {checkoutAttempted && validationErrors.paymentMethod && (
                          <p className="input-error">{validationErrors.paymentMethod}</p>
                        )}
                        <label className="terms-check terms-check--checkout">
                          <input
                            checked={checkoutData.acceptTerms}
                            onChange={(event) => updateCheckoutData('acceptTerms', event.target.checked)}
                            type="checkbox"
                          />
                          <span>
                            Acepto los <Link to="/terms">Terminos y Condiciones</Link>.
                          </span>
                        </label>
                        {checkoutAttempted && validationErrors.acceptTerms && (
                          <p className="input-error">{validationErrors.acceptTerms}</p>
                        )}
                        <label className="terms-check terms-check--checkout">
                          <input
                            checked={checkoutData.marketingOptIn}
                            onChange={(event) => updateCheckoutData('marketingOptIn', event.target.checked)}
                            type="checkbox"
                          />
                          <span>Quiero recibir ofertas y codigos por email.</span>
                        </label>
                      </>
                    )}

                    <div className="checkout-nav">
                      <button
                        className="btn btn--secondary"
                        disabled={stepIndex === 0 || submitting}
                        onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                        type="button"
                      >
                        Volver
                      </button>

                      {stepIndex < CHECKOUT_STEPS.length - 1 ? (
                        <button className="btn btn--xl" disabled={submitting} onClick={moveToNextStep} type="button">
                          Continuar
                        </button>
                      ) : (
                        <button className="btn btn--xl" disabled={submitting} onClick={placeOrder} type="button">
                          {submitting ? 'Procesando...' : 'Confirmar pedido'}
                        </button>
                      )}
                    </div>
                  </div>

                  <aside className="checkout-recap">
                    <h4>Resumen final</h4>
                    <p>
                      <span>Productos</span>
                      <strong>{cart.items.length}</strong>
                    </p>
                    <p>
                      <span>Subtotal</span>
                      <strong>{formatMoney(subtotal)}</strong>
                    </p>
                    <p>
                      <span>Descuento</span>
                      <strong>-{formatMoney(discountAmount)}</strong>
                    </p>
                    <p>
                      <span>Envio</span>
                      <strong>Gratis</strong>
                    </p>
                    <p className="checkout-recap__total">
                      <span>Total</span>
                      <strong>{formatMoney(finalTotal)}</strong>
                    </p>
                    <p className="stock">Entrega: {selectedShipping.eta}</p>
                    <div className="checkout-mini-items">
                      {cart.items.slice(0, 3).map((item) => (
                        <p key={item.product_id}>
                          <span>{item.name}</span>
                          <strong>x{item.quantity}</strong>
                        </p>
                      ))}
                    </div>
                  </aside>
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
