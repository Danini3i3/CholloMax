import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { saveToken } from '../lib/session';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      saveToken(data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel auth-panel">
      <h2>Crea tu cuenta</h2>
      <p>Empieza a acumular puntos en cada pedido.</p>
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="name">Nombre</label>
        <input id="name" onChange={(event) => setName(event.target.value)} required type="text" value={name} />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />

        <label htmlFor="password">Contrasena</label>
        <input
          id="password"
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />

        <button className="btn" disabled={loading} type="submit">
          {loading ? 'Creando...' : 'Registrarme'}
        </button>
      </form>

      {error && <p className="alert alert--error">{error}</p>}

      <p>
        Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
      </p>
    </section>
  );
}
