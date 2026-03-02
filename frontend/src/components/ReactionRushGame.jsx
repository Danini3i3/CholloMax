import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

export default function ReactionRushGame() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(20);
  const [running, setRunning] = useState(false);
  const [targets, setTargets] = useState([]);
  const [score, setScore] = useState(0);
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
    if (!running) return undefined;
    const spawner = window.setInterval(() => {
      const id = Math.random().toString(36).slice(2, 9);
      const newTarget = {
        id,
        x: 8 + Math.random() * 84,
        y: 12 + Math.random() * 70,
      };
      setTargets((prev) => [...prev.slice(-5), newTarget]);
    }, 500);
    return () => window.clearInterval(spawner);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      setRunning(false);
    }
  }, [timeLeft, running]);

  const start = () => {
    setTimeLeft(20);
    setScore(0);
    setStatus('');
    setTargets([]);
    setRunning(true);
    setClaimed(false);
  };

  const hit = (id) => {
    if (!running) return;
    setTargets((prev) => prev.filter((target) => target.id !== id));
    setScore((prev) => prev + 8);
  };

  const claim = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (claimed) {
      setStatus('Ya reclamaste esta ronda.');
      return;
    }
    const earned = Math.min(260, Math.floor(score * 0.9));
    if (earned <= 0) {
      setStatus('Necesitas mas puntuacion.');
      return;
    }
    try {
      const { data } = await api.post('/game/runner-claim', { points: earned });
      setStatus(`Ganaste ${data.earned} puntos. Nuevo saldo: ${data.newPoints}`);
      setClaimed(true);
    } catch (error) {
      setStatus(error.response?.data?.message || 'No se pudo reclamar');
    }
  };

  return (
    <section className="content-stack">
      <section className="panel arcade-panel">
        <div className="panel__header">
          <h2>Reaction Rush</h2>
          <Link className="btn btn--secondary" to="/games">
            Volver
          </Link>
        </div>
        <p>Revienta los objetivos lo mas rapido posible.</p>
        <div className="arcade-hud">
          <span className="pill">Tiempo: {timeLeft}s</span>
          <span className="pill">Puntuacion: {score}</span>
        </div>

        <div className="reaction-board">
          {targets.map((target) => (
            <button
              className="reaction-target"
              key={target.id}
              onClick={() => hit(target.id)}
              style={{ left: `${target.x}%`, top: `${target.y}%` }}
              type="button"
            >
              TAP
            </button>
          ))}
        </div>

        <div className="actions">
          {!running ? (
            <button className="btn btn--epic" onClick={start} type="button">
              Empezar
            </button>
          ) : (
            <p className="alert">Dale rapido...</p>
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
