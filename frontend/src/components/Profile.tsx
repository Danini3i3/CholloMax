import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(100);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProfile = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const { data } = await api.get('/user/profile');
      setProfile(data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const redeemPoints = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post('/user/redeem', { points: Number(pointsToRedeem) });
      setMessage(`Canje aplicado: ${data.discount}% de descuento. Puntos restantes: ${data.remainingPoints}`);
      loadProfile();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo canjear puntos');
    }
  };

  if (loading) {
    return <p>Cargando perfil...</p>;
  }

  if (!profile) {
    return <p className="alert alert--error">{message || 'No se encontró el perfil'}</p>;
  }

  return (
    <section className="panel profile-panel">
      <h2>Perfil de usuario</h2>
      <div className="profile-data">
        <p>
          <strong>Nombre:</strong> {profile.name}
        </p>
        <p>
          <strong>Email:</strong> {profile.email}
        </p>
        <p>
          <strong>Puntos:</strong> {profile.puntos}
        </p>
        <p>
          <strong>Registro:</strong> {new Date(profile.fecha_registro).toLocaleDateString('es-ES')}
        </p>
      </div>

      <form className="form" onSubmit={redeemPoints}>
        <label htmlFor="redeem">Puntos a canjear</label>
        <input
          id="redeem"
          min={100}
          onChange={(event) => setPointsToRedeem(event.target.value)}
          step={100}
          type="number"
          value={pointsToRedeem}
        />
        <button className="btn" type="submit">
          Canjear puntos
        </button>
      </form>

      {message && <p className="alert">{message}</p>}
    </section>
  );
}
