import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { saveToken } from '../lib/session';

export default function Login() {
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
      const { data } = await api.post('/auth/login', { email, password });
      saveToken(data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel auth-panel">
      <h2>Inicia sesión</h2>
      <p>Accede para guardar carrito, canjear puntos y jugar cada día.</p>
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />

        <button className="btn" disabled={loading} type="submit">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {error && <p className="alert alert--error">{error}</p>}

      <p>
        ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
      </p>
    </section>
  );
}
