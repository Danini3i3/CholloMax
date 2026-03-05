import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

const PROMO_CODE = 'SOBRETOCHO35';
const PROMO_PERCENT = 35;

function formatMoney(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

function timeLeft(endDate) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'Finalizada';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

function getDiscountRate(id) {
  const rates = [18, 22, 27, 34, 41, 53];
  return rates[id % rates.length];
}

function formatOfferPrice(price, discountRate) {
  return price * (1 - discountRate / 100);
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoOpened, setPromoOpened] = useState(false);
  const [promoActive, setPromoActive] = useState(() => window.localStorage.getItem('promo_sobre_tocho') === '1');
  const navigate = useNavigate();

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (!category) return products;
    return products.filter((product) => product.category === category);
  }, [products, category]);

  useEffect(() => {
    const load = async () => {
      try {
        const [productsRes, offersRes] = await Promise.all([api.get('/products'), api.get('/flash/active')]);
        setProducts(productsRes.data);
        setOffers(offersRes.data);
      } catch (error) {
        setMessage(error.response?.data?.message || 'No se pudieron cargar los productos');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const msgTimer = window.setTimeout(() => setMessage(''), 2600);
    return () => window.clearTimeout(msgTimer);
  }, [message]);

  const unlockPromo = () => {
    setPromoOpened(true);
    setPromoActive(true);
    window.localStorage.setItem('promo_sobre_tocho', '1');
    setMessage(`Promo activada: ${PROMO_PERCENT}% con ${PROMO_CODE}`);
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      await api.post('/cart/add', { productId, quantity: 1 });
      setMessage('Producto agregado al carrito');
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo agregar al carrito');
    }
  };

  return (
    <section className="content-stack">
      <div className="hero">
        <p className="kicker">Ofertas de 24 horas</p>
        <h1>CholloMax</h1>
        <p>Descubre productos en tendencia, suma puntos y juega tu ruleta diaria.</p>
        <div className="hero__ticker" aria-hidden="true">
          <span>ENVÍO GRATIS</span>
          <span>DESCUENTOS EXTREMOS</span>
          <span>FLASH EVERY HOUR</span>
          <span>2x PUNTOS HOY</span>
          <span>ENVÍO GRATIS</span>
          <span>DESCUENTOS EXTREMOS</span>
        </div>
      </div>

      <section className="panel promo-home">
        <div className="panel__header">
          <h2>Sobre Promo</h2>
          <span className="pill">-{PROMO_PERCENT}% visible</span>
        </div>
        <p>
          El descuento se ve antes de abrir: <strong>{PROMO_CODE}</strong> da <strong>{PROMO_PERCENT}%</strong> en
          carrito.
        </p>
        <div className="actions">
          <button className="btn btn--epic" onClick={() => setPromoOpen(true)} type="button">
            Ver sobre
          </button>
          <Link className="btn btn--secondary" to="/cart">
            Ir al carrito
          </Link>
          {promoActive && <span className="deal-chip deal-chip--hot">Cupón activo</span>}
        </div>
      </section>

      {offers.length > 0 && (
        <section className="panel">
          <h2>Ofertas Flash activas</h2>
          <div className="grid grid--offers">
            {offers.map((offer) => (
              <article className="card card--offer" key={offer.id}>
                <h3>{offer.title || 'Oferta especial'}</h3>
                <p>{offer.description || 'Sin descripción'}</p>
                <div className="offer-meta">
                  <span className="pill">Termina en {timeLeft(offer.fecha_fin)}</span>
                  <span className="offer-pulse">FLASH</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel__header">
          <h2>Catálogo</h2>
          <select className="select" onChange={(event) => setCategory(event.target.value)} value={category}>
            <option value="">Todas</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Cargando productos...</p>
        ) : (
          <div className="grid grid--products">
            {filteredProducts.map((product) => (
              <article className="card product-card sale-card" key={product.id}>
                <span className="sale-badge">-{getDiscountRate(product.id)}%</span>
                <span className="sale-tag">TOP DEAL</span>
                <img
                  alt={product.name}
                  className="product-card__image"
                  src={
                    product.image_url ||
                    'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=80'
                  }
                />
                <h3>{product.name}</h3>
                <p className="product-card__description">{product.description || 'Sin descripción'}</p>
                <div className="price-stack">
                  <p className="old-price">{formatMoney(product.price)}</p>
                  <p className="price">{formatMoney(formatOfferPrice(product.price, getDiscountRate(product.id)))}</p>
                </div>
                <div className="deal-line">
                  <span className="deal-chip">Tiempo limitado</span>
                  <span className="deal-chip deal-chip--hot">Quedan {Math.max(2, product.stock - 1)}</span>
                </div>
                <p className="stock">Stock: {product.stock}</p>
                <div className="actions">
                  <Link className="btn btn--secondary" to={`/product/${product.id}`}>
                    Ver detalle
                  </Link>
                  <button className="btn" onClick={() => handleAddToCart(product.id)} type="button">
                    Añadir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {message && <p className="alert">{message}</p>}

      {promoOpen && (
        <div className="popup-overlay popup-overlay--epic" onClick={() => setPromoOpen(false)} role="presentation">
          <article className="popup-card promo-popup" onClick={(event) => event.stopPropagation()}>
            <button className="popup-close" onClick={() => setPromoOpen(false)} type="button">
              x
            </button>
            <p className="kicker">Sobre premium</p>
            <h3>Descuento visible antes de abrir</h3>
            <p>
              Premio dentro: <strong>{PROMO_PERCENT}% OFF</strong> con código <strong>{PROMO_CODE}</strong>.
            </p>

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
              <button className="btn btn--xl" onClick={unlockPromo} type="button">
                Abrir sobre
              </button>
            ) : (
              <div className="actions">
                <span className="alert alert--success">Descuento activado para el carrito.</span>
                <Link className="btn" to="/cart">
                  Usar descuento
                </Link>
              </div>
            )}
          </article>
        </div>
      )}
    </section>
  );
}
