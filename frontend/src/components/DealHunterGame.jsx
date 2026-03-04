import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

function randomTarget() {
  return Math.floor(20 + Math.random() * 380);
}

export default function DealHunterGame() {
  const navigate = useNavigate();
  const [round, setRound] = useState(1);
  const [target, setTarget] = useState(randomTarget);
  const [guess, setGuess] = useState(200);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState('');
  const [claimed, setClaimed] = useState(false);

  const maxRounds = 5;
  const potential = useMemo(() => Math.min(240, Math.floor(score)), [score]);

  const submitGuess = () => {
    if (done) return;
    const distance = Math.abs(target - guess);
    const gained = Math.max(8, 60 - Math.floor(distance / 4));
    const nextScore = score + gained;

    if (round >= maxRounds) {
      setScore(nextScore);
      setDone(true);
      setStatus(`Ronda final. Precio objetivo era ${target} EUR. +${gained} puntos de habilidad.`);
      return;
    }

    setScore(nextScore);
    setStatus(`Objetivo: ${target} EUR, tu apuesta: ${guess} EUR. +${gained} puntos.`);
    setRound((prev) => prev + 1);
    setTarget(randomTarget());
    setGuess(200);
  };

  const reset = () => {
    setRound(1);
    setTarget(randomTarget());
    setGuess(200);
    setScore(0);
    setDone(false);
    setStatus('');
    setClaimed(false);
  };

  const claim = async () => {
    if (!done) {
      setStatus('Termina las 5 rondas primero.');
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

    try {
      const { data } = await api.post('/game/runner-claim', { points: potential, gameKey: 'deal_hunter' });
      setStatus(`Deal Hunter: +${data.earned} puntos. Saldo: ${data.newPoints}`);
      setClaimed(true);
    } catch (error) {
      setStatus(error.response?.data?.message || 'No se pudo reclamar');
    }
  };

  return (
    <section className="content-stack">
      <section className="panel arcade-panel">
        <div className="panel__header">
          <h2>Deal Hunter</h2>
          <Link className="btn btn--secondary" to="/games">
            Volver
          </Link>
        </div>
        <p>Adivina el precio objetivo del chollo. Cuanto mas cerca, mas puntos.</p>

        <div className="arcade-hud">
          <span className="pill">Ronda: {round}/{maxRounds}</span>
          <span className="pill">Apuesta: {guess} EUR</span>
          <span className="pill">Puntos: {potential}</span>
        </div>

        <div className="deal-hunter-stage">
          <input max={500} min={0} onChange={(event) => setGuess(Number(event.target.value))} type="range" value={guess} />
          <button className="btn btn--epic" disabled={done} onClick={submitGuess} type="button">
            Confirmar apuesta
          </button>
        </div>

        <div className="actions">
          <button className="btn btn--secondary" onClick={reset} type="button">
            Reiniciar
          </button>
          <button className="btn btn--danger" disabled={!done} onClick={claim} type="button">
            Reclamar puntos
          </button>
        </div>

        {status && <p className="alert">{status}</p>}
      </section>
    </section>
  );
}
