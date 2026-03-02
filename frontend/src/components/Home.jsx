import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

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

export default function Home() {
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
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
      </div>

      {offers.length > 0 && (
        <section className="panel">
          <h2>Ofertas Flash activas</h2>
          <div className="grid grid--offers">
            {offers.map((offer) => (
              <article className="card card--offer" key={offer.id}>
                <h3>{offer.title || 'Oferta especial'}</h3>
                <p>{offer.description || 'Sin descripcion'}</p>
                <span className="pill">{timeLeft(offer.fecha_fin)}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel__header">
          <h2>Catalogo</h2>
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
              <article className="card product-card" key={product.id}>
                <img
                  alt={product.name}
                  className="product-card__image"
                  src={
                    product.image_url ||
                    'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=80'
                  }
                />
                <h3>{product.name}</h3>
                <p className="product-card__description">{product.description || 'Sin descripcion'}</p>
                <p className="price">{formatMoney(product.price)}</p>
                <p className="stock">Stock: {product.stock}</p>
                <div className="actions">
                  <Link className="btn btn--secondary" to={`/product/${product.id}`}>
                    Ver detalle
                  </Link>
                  <button className="btn" onClick={() => handleAddToCart(product.id)} type="button">
                    Anadir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {message && <p className="alert">{message}</p>}
    </section>
  );
}
