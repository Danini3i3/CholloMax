import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

export default function DuelArenaGame() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(18);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [status, setStatus] = useState('');
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!running) return undefined;

    const onKey = (event) => {
      const key = event.key.toLowerCase();
      if (key === 'a') setP1Score((prev) => prev + 1);
      if (key === 'l') setP2Score((prev) => prev + 1);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running]);

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
    setTimeLeft(18);
    setP1Score(0);
    setP2Score(0);
    setClaimed(false);
    setStatus('');
  };

  const winnerLabel = p1Score === p2Score ? 'Empate' : p1Score > p2Score ? 'Jugador 1' : 'Jugador 2';
  const winnerScore = Math.max(p1Score, p2Score);
  const reward = Math.min(280, Math.floor(winnerScore * 4.2));

  const claim = async () => {
    if (running) {
      setStatus('Espera a que termine el duelo.');
      return;
    }
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (claimed) {
      setStatus('Ya reclamaste este duelo.');
      return;
    }
    if (reward <= 0) {
      setStatus('Sin puntuación suficiente para reclamar.');
      return;
    }

    try {
      const { data } = await api.post('/game/runner-claim', {
        points: reward,
        gameKey: 'duel_arena_multiplayer',
      });
      setStatus(`${winnerLabel} gana. +${data.earned} puntos. Saldo: ${data.newPoints}`);
      setClaimed(true);
    } catch (error) {
      setStatus(error.response?.data?.message || 'No se pudo reclamar');
    }
  };

  return (
    <section className="content-stack">
      <section className="panel arcade-panel">
        <div className="panel__header">
          <h2>Duel Arena (2 jugadores)</h2>
          <Link className="btn btn--secondary" to="/games">
            Volver
          </Link>
        </div>
        <p>Jugador 1 pulsa A. Jugador 2 pulsa L. Tenéis 18 segundos.</p>

        <div className="arcade-hud">
          <span className="pill">Tiempo: {timeLeft}s</span>
          <span className="pill">J1: {p1Score}</span>
          <span className="pill">J2: {p2Score}</span>
          <span className="pill">Ganador: {winnerLabel}</span>
        </div>

        <div className="duel-stage">
          <article className="duel-card">
            <h3>Jugador 1</h3>
            <p>Tecla A</p>
            <strong>{p1Score}</strong>
          </article>
          <article className="duel-card">
            <h3>Jugador 2</h3>
            <p>Tecla L</p>
            <strong>{p2Score}</strong>
          </article>
        </div>

        <div className="actions">
          {!running ? (
            <button className="btn btn--epic" onClick={start} type="button">
              Empezar duelo
            </button>
          ) : (
            <p className="alert">Duelo en curso...</p>
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
