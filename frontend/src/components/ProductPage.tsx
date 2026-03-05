import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

function formatMoney(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

function getDiscountRate(id) {
  const rates = [16, 24, 31, 38, 46];
  return rates[id % rates.length];
}

function randomBought(id) {
  return 180 + (id % 9) * 73;
}

const FEATURES = ['Envío rápido 24/48h', 'Devolución gratis 30 días', 'Pago seguro cifrado', 'Soporte premium'];

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (error) {
        setMessage(error.response?.data?.message || 'No se pudo cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const discountRate = useMemo(() => getDiscountRate(Number(id)), [id]);
  const discountedPrice = useMemo(() => {
    if (!product) return 0;
    return product.price * (1 - discountRate / 100);
  }, [product, discountRate]);

  const stockProgress = useMemo(() => {
    if (!product) return 0;
    const safeStock = Math.max(1, product.stock);
    return Math.min(100, Math.max(8, safeStock * 7));
  }, [product]);

  const addToCart = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      await api.post('/cart/add', { productId: Number(id), quantity: Number(quantity) });
      setMessage('Producto agregado al carrito');
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo agregar al carrito');
    }
  };

  if (loading) {
    return <p>Cargando producto...</p>;
  }

  if (!product) {
    return <p className="alert alert--error">{message || 'Producto no encontrado'}</p>;
  }

  return (
    <section className="content-stack product-bloated">
      <section className="panel product-detail product-detail--temu">
        <div className="product-detail__media">
          <span className="sale-badge">-{discountRate}%</span>
          <span className="sale-tag">SE AGOTA</span>
          <img
            alt={product.name}
            className="product-detail__image"
            src={
              product.image_url ||
              'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1100&q=80'
            }
          />
          <div className="product-mini-badges">
            <span className="deal-chip">+{randomBought(Number(id))} vendidos</span>
            <span className="deal-chip deal-chip--hot">4.8/5 valoración</span>
          </div>
        </div>

        <div className="product-detail__content">
          <p className="kicker">{product.category || 'Producto destacado'}</p>
          <h2>{product.name}</h2>
          <p>{product.description || 'Sin descripción'}</p>

          <div className="price-stack price-stack--big">
            <p className="old-price">{formatMoney(product.price)}</p>
            <p className="price">{formatMoney(discountedPrice)}</p>
          </div>

          <div className="coupon-inline">
            <strong>CUPÓN FLASH:</strong> TEMU-PLUS-15
            <button className="btn btn--secondary" type="button">
              Copiar
            </button>
          </div>

          <div className="stock-meter">
            <div className="stock-meter__bar" style={{ width: `${stockProgress}%` }} />
          </div>
          <p className="stock">Stock disponible: {product.stock} (quedan pocas unidades)</p>

          <label htmlFor="quantity">Cantidad</label>
          <input
            id="quantity"
            max={product.stock}
            min={1}
            onChange={(event) => setQuantity(event.target.value)}
            type="number"
            value={quantity}
          />

          <div className="actions">
            <button className="btn btn--epic" onClick={addToCart} type="button">
              Añadir al carrito
            </button>
            <button className="btn btn--secondary" onClick={() => navigate('/cart')} type="button">
              Comprar ahora
            </button>
          </div>
          {message && <p className="alert">{message}</p>}
        </div>
      </section>

      <section className="panel product-extras">
        <div className="extras-grid">
          <article className="extra-box">
            <h3>Beneficios de compra</h3>
            {FEATURES.map((feature) => (
              <p key={feature}>- {feature}</p>
            ))}
          </article>

          <article className="extra-box extra-box--hot">
            <h3>Oferta activa</h3>
            <p>Compra en los próximos 20 min y recibes 2x puntos.</p>
            <p className="deal-chip deal-chip--hot">Promo en cuenta atrás</p>
          </article>

          <article className="extra-box">
            <h3>Reseñas destacadas</h3>
            <p>"Muy buena calidad, envío rápido" - Lucía M.</p>
            <p>"Por ese precio es un chollo total" - Carlos R.</p>
          </article>
        </div>
      </section>
    </section>
  );
}
