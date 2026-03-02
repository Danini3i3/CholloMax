import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

function prizeText(prize) {
  if (!prize) return '';
  if (prize.type === 'points') return `Has ganado ${prize.amount} puntos`;
  if (prize.type === 'discount') return `Has ganado ${prize.amount}% de descuento`;
  if (prize.type === 'shipping') return 'Has ganado envio gratis';
  return 'Sin premio esta vez';
}

export default function Game() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const spin = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    setSpinning(true);
    setMessage('');

    try {
      const { data } = await api.post('/game/spin');
      setResult(data.prize);
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo jugar');
    } finally {
      setSpinning(false);
    }
  };

  return (
    <section className="panel game-panel">
      <h2>Ruleta diaria</h2>
      <p>Solo puedes jugar una vez cada 24 horas.</p>

      <button className={`btn btn--xl${spinning ? ' is-spinning' : ''}`} disabled={spinning} onClick={spin} type="button">
        {spinning ? 'Girando...' : 'Girar ruleta'}
      </button>

      {result && <p className="alert alert--success">{prizeText(result)}</p>}
      {message && <p className="alert alert--error">{message}</p>}
    </section>
  );
}
