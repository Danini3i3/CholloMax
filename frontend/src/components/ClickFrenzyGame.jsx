import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

export default function ClickFrenzyGame() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(12);
  const [clicks, setClicks] = useState(0);
  const [status, setStatus] = useState('');
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (running && timeLeft <= 0) {
      setRunning(false);
    }
  }, [running, timeLeft]);

  const start = () => {
    setRunning(true);
    setTimeLeft(12);
    setClicks(0);
    setStatus('');
    setClaimed(false);
  };

  const claim = async () => {
    if (running) {
      setStatus('Espera a que termine la ronda.');
      return;
    }
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (claimed) {
      setStatus('Ya reclamaste esta ronda.');
      return;
    }

    const earned = Math.min(250, Math.floor(clicks * 2.6));
    if (earned <= 0) {
      setStatus('Haz mas clicks para ganar puntos.');
      return;
    }

    try {
      const { data } = await api.post('/game/runner-claim', { points: earned, gameKey: 'click_frenzy' });
      setStatus(`Click Frenzy: +${data.earned} puntos. Saldo: ${data.newPoints}`);
      setClaimed(true);
    } catch (error) {
      setStatus(error.response?.data?.message || 'No se pudo reclamar');
    }
  };

  return (
    <section className="content-stack">
      <section className="panel arcade-panel">
        <div className="panel__header">
          <h2>Click Frenzy</h2>
          <Link className="btn btn--secondary" to="/games">
            Volver
          </Link>
        </div>
        <p>Haz la maxima cantidad de clicks en 12 segundos.</p>
        <div className="arcade-hud">
          <span className="pill">Tiempo: {timeLeft}s</span>
          <span className="pill">Clicks: {clicks}</span>
          <span className="pill">Puntos estimados: {Math.min(250, Math.floor(clicks * 2.6))}</span>
        </div>

        <div className="click-frenzy-stage">
          <button
            className="btn btn--xl btn--epic click-frenzy-btn"
            disabled={!running}
            onClick={() => setClicks((prev) => prev + 1)}
            type="button"
          >
            CLICK
          </button>
        </div>

        <div className="actions">
          {!running ? (
            <button className="btn btn--epic" onClick={start} type="button">
              Empezar ronda
            </button>
          ) : (
            <p className="alert">Spam de clicks activo...</p>
          )}
          <button className="btn btn--danger" disabled={running} onClick={claim} type="button">
            Reclamar puntos
          </button>
        </div>

        {status && <p className="alert alert--success">{status}</p>}
      </section>
    </section>
  );
}
