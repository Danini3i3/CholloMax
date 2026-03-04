import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

const SYMBOLS = ['A', 'B', 'C', 'D', 'E', 'F'];

function shuffledDeck() {
  const pairs = [...SYMBOLS, ...SYMBOLS];
  return pairs
    .map((value, index) => ({ id: `${value}-${index}-${Math.random()}`, value, matched: false }))
    .sort(() => Math.random() - 0.5);
}

export default function MemoryFlipGame() {
  const navigate = useNavigate();
  const [deck, setDeck] = useState(shuffledDeck);
  const [openCards, setOpenCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [status, setStatus] = useState('');
  const [claimed, setClaimed] = useState(false);

  const matchedCount = useMemo(() => deck.filter((card) => card.matched).length, [deck]);
  const completed = matchedCount === deck.length;
  const points = Math.max(20, 220 - moves * 6);

  const reset = () => {
    setDeck(shuffledDeck());
    setOpenCards([]);
    setMoves(0);
    setStatus('');
    setClaimed(false);
  };

  const onFlip = (card) => {
    if (card.matched) return;
    if (openCards.find((c) => c.id === card.id)) return;
    if (openCards.length === 2) return;

    const nextOpen = [...openCards, card];
    setOpenCards(nextOpen);

    if (nextOpen.length === 2) {
      setMoves((prev) => prev + 1);
      const [first, second] = nextOpen;
      if (first.value === second.value) {
        setDeck((prev) => prev.map((it) => (it.value === first.value ? { ...it, matched: true } : it)));
        setOpenCards([]);
      } else {
        window.setTimeout(() => setOpenCards([]), 600);
      }
    }
  };

  const claim = async () => {
    if (!completed) {
      setStatus('Completa el tablero antes de reclamar.');
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
      const { data } = await api.post('/game/runner-claim', {
        points: Math.min(240, points),
        gameKey: 'memory_flip',
      });
      setStatus(`Memoria top: +${data.earned} puntos. Saldo: ${data.newPoints}`);
      setClaimed(true);
    } catch (error) {
      setStatus(error.response?.data?.message || 'No se pudo reclamar');
    }
  };

  return (
    <section className="content-stack">
      <section className="panel arcade-panel">
        <div className="panel__header">
          <h2>Memory Flip</h2>
          <Link className="btn btn--secondary" to="/games">
            Volver
          </Link>
        </div>
        <p>Encuentra parejas. Menos movimientos = mas puntos.</p>
        <div className="arcade-hud">
          <span className="pill">Movimientos: {moves}</span>
          <span className="pill">Parejas: {matchedCount / 2}/6</span>
          <span className="pill">Puntos: {Math.min(240, points)}</span>
        </div>

        <div className="memory-grid">
          {deck.map((card) => {
            const visible = card.matched || openCards.find((c) => c.id === card.id);
            return (
              <button
                className={`memory-card${visible ? ' memory-card--open' : ''}`}
                key={card.id}
                onClick={() => onFlip(card)}
                type="button"
              >
                {visible ? card.value : '?'}
              </button>
            );
          })}
        </div>

        <div className="actions">
          <button className="btn btn--secondary" onClick={reset} type="button">
            Reiniciar
          </button>
          <button className="btn btn--epic" disabled={!completed} onClick={claim} type="button">
            Reclamar puntos
          </button>
        </div>

        {completed && <p className="alert alert--success">Tablero completado.</p>}
        {status && <p className="alert">{status}</p>}
      </section>
    </section>
  );
}
