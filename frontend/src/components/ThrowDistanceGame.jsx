import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

export default function ThrowDistanceGame() {
  const navigate = useNavigate();
  const [angle, setAngle] = useState(42);
  const [power, setPower] = useState(62);
  const [flying, setFlying] = useState(false);
  const [projectile, setProjectile] = useState({ x: 0, y: 0 });
  const [distance, setDistance] = useState(0);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState('');
  const [wind] = useState(() => (Math.random() * 16 - 8).toFixed(1));

  const points = useMemo(() => Math.min(320, Math.floor(distance * 1.8)), [distance]);

  const launch = () => {
    if (flying) return;
    setFlying(true);
    setStatus('');
    setProjectile({ x: 0, y: 0 });
    setDistance(0);

    const rad = (angle * Math.PI) / 180;
    const vx = power * 0.95 * Math.cos(rad) + Number(wind) * 0.1;
    const vy = power * 1.2 * Math.sin(rad);
    const gravity = 45;
    const scale = 5.2;

    let t = 0;
    let raf = 0;

    const step = () => {
      t += 0.016;
      const x = Math.max(0, vx * t);
      const y = vy * t - 0.5 * gravity * t * t;

      if (y <= 0 && t > 0.05) {
        const finalDistance = Number(x.toFixed(1));
        setDistance(finalDistance);
        setBest((prev) => Math.max(prev, finalDistance));
        setProjectile({ x: finalDistance, y: 0 });
        setFlying(false);
        return;
      }

      setProjectile({ x, y });
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  };

  const claimPoints = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (points <= 0) {
      setStatus('Primero lanza un objeto para sumar distancia.');
      return;
    }

    try {
      const { data } = await api.post('/game/runner-claim', { points });
      setStatus(`Ganaste ${data.earned} puntos por distancia. Saldo: ${data.newPoints}`);
    } catch (error) {
      setStatus(error.response?.data?.message || 'No se pudo reclamar puntos');
    }
  };

  return (
    <section className="content-stack">
      <section className="panel arcade-panel">
        <div className="panel__header">
          <h2>Lanzamiento Extremo</h2>
          <Link className="btn btn--secondary" to="/games">
            Volver a juegos
          </Link>
        </div>
        <p>Lanza objetos lo mas lejos posible. Cuanto mas lejos, mas puntos.</p>

        <div className="throw-controls">
          <label htmlFor="angle">Angulo: {angle} deg</label>
          <input id="angle" max={75} min={15} onChange={(event) => setAngle(Number(event.target.value))} type="range" value={angle} />

          <label htmlFor="power">Potencia: {power}%</label>
          <input id="power" max={100} min={30} onChange={(event) => setPower(Number(event.target.value))} type="range" value={power} />
        </div>

        <div className="throw-stats">
          <span className="pill">Viento: {wind} m/s</span>
          <span className="pill">Distancia: {distance} m</span>
          <span className="pill">Record: {best} m</span>
          <span className="pill">Puntos: {points}</span>
        </div>

        <div className="throw-arena">
          <div className="throw-ground" />
          <div className="throw-projectile" style={{ left: `${8 + projectile.x * 0.8}%`, bottom: `${12 + projectile.y * 1.6}%` }}>
            OBJ
          </div>
        </div>

        <div className="actions">
          <button className="btn btn--epic" disabled={flying} onClick={launch} type="button">
            {flying ? 'Lanzando...' : 'Lanzar objeto'}
          </button>
          <button className="btn btn--danger" disabled={flying} onClick={claimPoints} type="button">
            Reclamar puntos
          </button>
        </div>

        {status && <p className="alert alert--success">{status}</p>}
      </section>
    </section>
  );
}
