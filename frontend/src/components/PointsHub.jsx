import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

const translate = (msg) => {
  const dict = {
    'Invalid stake': 'Apuesta invalida.',
    'Invalid choice': 'Seleccion invalida.',
    'Not enough points': 'No tienes puntos suficientes.',
    'User not found': 'Usuario no encontrado.',
    'Invalid points to redeem': 'Puntos invalidos para canjear.',
  };
  return dict[msg] || msg || 'Ha ocurrido un error.';
};

export default function PointsHub() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [stake, setStake] = useState(50);
  const [choice, setChoice] = useState('red');
  const [redeemPoints, setRedeemPoints] = useState(200);
  const [gambleResult, setGambleResult] = useState(null);
  const navigate = useNavigate();

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/user/profile');
      setProfile(data);
    } catch (error) {
      setMessage(translate(error.response?.data?.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, []);

  const gamble = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post('/game/gamble', { stake: Number(stake), choice });
      setGambleResult(data);
      setMessage(
        data.result === 'win'
          ? `Ganaste ${data.delta} puntos. Color: ${data.rolled}`
          : `Perdiste ${Math.abs(data.delta)} puntos. Color: ${data.rolled}`
      );
      setProfile((prev) => ({ ...prev, puntos: data.newPoints }));
    } catch (error) {
      setMessage(translate(error.response?.data?.message));
    }
  };

  const redeem = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post('/user/redeem', { points: Number(redeemPoints) });
      setMessage(`Canjeado: ${data.discount}% de descuento. Te quedan ${data.remainingPoints} puntos.`);
      setProfile((prev) => ({ ...prev, puntos: data.remainingPoints }));
    } catch (error) {
      setMessage(translate(error.response?.data?.message));
    }
  };

  if (loading) return <p>Cargando arena de puntos...</p>;
  if (!profile) return <p className="alert alert--error">{message || 'No se pudo cargar.'}</p>;

  return (
    <section className="content-stack points-hub">
      <section className="panel points-hero">
        <p className="kicker">Arena de puntos</p>
        <h2>Gana y gasta tus puntos</h2>
        <p>Tienes <strong>{profile.puntos}</strong> puntos disponibles.</p>
      </section>

      <div className="points-grid">
        <article className="panel points-card">
          <h3>Ganar puntos</h3>
          <p>Juega la ruleta epica y usa gamble para multiplicar saldo.</p>
          <div className="actions">
            <Link className="btn btn--epic" to="/game">
              Ir a la ruleta
            </Link>
          </div>
          <form className="form gamble-form" onSubmit={gamble}>
            <label htmlFor="stake">Apuesta</label>
            <input
              id="stake"
              max={Math.max(10, profile.puntos)}
              min={10}
              onChange={(event) => setStake(event.target.value)}
              step={10}
              type="number"
              value={stake}
            />
            <label htmlFor="choice">Color</label>
            <select id="choice" onChange={(event) => setChoice(event.target.value)} value={choice}>
              <option value="red">Rojo</option>
              <option value="black">Negro</option>
            </select>
            <button className="btn btn--danger" type="submit">
              Apostar puntos
            </button>
          </form>
          {gambleResult && (
            <p className={`alert ${gambleResult.result === 'win' ? 'alert--success' : 'alert--error'}`}>
              {gambleResult.result === 'win' ? 'Victoria' : 'Derrota'}: {gambleResult.rolled}
            </p>
          )}
        </article>

        <article className="panel points-card">
          <h3>Gastar puntos</h3>
          <p>Canjea tus puntos por descuento para tus pedidos.</p>
          <form className="form" onSubmit={redeem}>
            <label htmlFor="redeem-points">Puntos a gastar</label>
            <input
              id="redeem-points"
              min={100}
              onChange={(event) => setRedeemPoints(event.target.value)}
              step={100}
              type="number"
              value={redeemPoints}
            />
            <button className="btn" type="submit">
              Canjear ahora
            </button>
          </form>
          <div className="redeem-help">
            <p>100 puntos = 5% descuento</p>
            <p>200 puntos = 10% descuento</p>
            <p>500 puntos = 25% descuento</p>
          </div>
        </article>
      </div>

      {message && <p className="alert">{message}</p>}
    </section>
  );
}
