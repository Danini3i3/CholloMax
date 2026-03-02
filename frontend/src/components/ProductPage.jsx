import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

function formatMoney(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

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
    <section className="panel product-detail">
      <img
        alt={product.name}
        className="product-detail__image"
        src={
          product.image_url ||
          'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1100&q=80'
        }
      />
      <div className="product-detail__content">
        <p className="kicker">{product.category || 'Producto destacado'}</p>
        <h2>{product.name}</h2>
        <p>{product.description || 'Sin descripcion'}</p>
        <p className="price">{formatMoney(product.price)}</p>
        <p className="stock">Stock disponible: {product.stock}</p>

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
          <button className="btn" onClick={addToCart} type="button">
            Anadir al carrito
          </button>
          <button className="btn btn--secondary" onClick={() => navigate('/cart')} type="button">
            Ir al carrito
          </button>
        </div>
        {message && <p className="alert">{message}</p>}
      </div>
    </section>
  );
}
