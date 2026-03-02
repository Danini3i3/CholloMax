import React, { useEffect, useMemo, useState } from 'react';
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

const COUPONS = [
  { id: 'c5', title: 'Cupon 5%', points: 100, badge: 'HOT' },
  { id: 'c10', title: 'Cupon 10%', points: 200, badge: 'TOP' },
  { id: 'c20', title: 'Cupon 20%', points: 400, badge: 'MEGA' },
  { id: 'ship', title: 'Envio Gratis', points: 100, badge: 'FLASH' },
];

function buildCouponCode(couponId) {
  const randomBlock = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TEMU-${couponId.toUpperCase()}-${randomBlock}`;
}

export default function PointsHub() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [stake, setStake] = useState(50);
  const [choice, setChoice] = useState('red');
  const [redeemPoints, setRedeemPoints] = useState(200);
  const [gambleResult, setGambleResult] = useState(null);
  const [claimedCoupons, setClaimedCoupons] = useState([]);
  const navigate = useNavigate();

  const couponTicker = useMemo(() => {
    return ['CUPONES FLASH', 'DESCUENTO MASIVO', 'DOBLE PUNTOS', 'OFERTA LIMITADA'];
  }, []);

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

  const claimCoupon = async (coupon) => {
    if (!profile || profile.puntos < coupon.points) {
      setMessage('No tienes puntos suficientes para este cupon.');
      return;
    }

    try {
      await api.post('/user/redeem', { points: coupon.points });
      const code = buildCouponCode(coupon.id);
      setClaimedCoupons((prev) => [{ ...coupon, code }, ...prev].slice(0, 6));
      setProfile((prev) => ({ ...prev, puntos: prev.puntos - coupon.points }));
      setMessage(`Cupon desbloqueado: ${code}`);
    } catch (error) {
      setMessage(translate(error.response?.data?.message));
    }
  };

  if (loading) return <p>Cargando arena de puntos...</p>;
  if (!profile) return <p className="alert alert--error">{message || 'No se pudo cargar.'}</p>;

  return (
    <section className="content-stack points-hub points-hub--temu">
      <section className="panel points-hero points-hero--temu">
        <p className="kicker">Temu style points arena</p>
        <h2>Centro de Puntos Maximos</h2>
        <p>
          Saldo actual: <strong>{profile.puntos}</strong> puntos
        </p>
        <div className="points-marquee" aria-hidden="true">
          {couponTicker.concat(couponTicker).map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </section>

      <div className="points-grid points-grid--temu">
        <article className="panel points-card points-card--temu">
          <span className="temu-burst">x2</span>
          <h3>Ganar con juegos y gambleo</h3>
          <p>Ruleta epica + apuesta rojo/negro para farmear puntos rapido.</p>
          <div className="actions">
            <Link className="btn btn--epic" to="/games">
              Ir a seccion juegos
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

        <article className="panel points-card points-card--temu points-card--spend">
          <h3>Gastar puntos ahora</h3>
          <p>Canje instantaneo para aplicar descuento de compra.</p>
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
              Canjear ya
            </button>
          </form>
          <div className="redeem-help">
            <p>100 puntos = 5% descuento</p>
            <p>200 puntos = 10% descuento</p>
            <p>500 puntos = 25% descuento</p>
          </div>
        </article>
      </div>

      <section className="panel coupons-zone">
        <div className="panel__header">
          <h3>Cupones Flash estilo Temu</h3>
          <span className="sale-tag">LIMITADO</span>
        </div>
        <div className="coupons-grid">
          {COUPONS.map((coupon) => (
            <article className="coupon-card" key={coupon.id}>
              <span className="coupon-badge">{coupon.badge}</span>
              <h4>{coupon.title}</h4>
              <p>Costo: {coupon.points} puntos</p>
              <button className="btn" onClick={() => claimCoupon(coupon)} type="button">
                Desbloquear
              </button>
            </article>
          ))}
        </div>

        {claimedCoupons.length > 0 && (
          <div className="claimed-list">
            <h4>Mis cupones desbloqueados</h4>
            <div className="claimed-grid">
              {claimedCoupons.map((coupon) => (
                <article className="claimed-item" key={coupon.code}>
                  <strong>{coupon.title}</strong>
                  <p>{coupon.code}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {message && <p className="alert">{message}</p>}
    </section>
  );
}
