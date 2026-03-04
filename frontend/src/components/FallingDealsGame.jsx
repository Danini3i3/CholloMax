import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

const LANES = [0, 1, 2, 3, 4];

function randomItem() {
  const roll = Math.random();
  if (roll < 0.3) return { type: 'bomb', speed: 34 + Math.random() * 10 };
  if (roll < 0.62) return { type: 'discount', speed: 28 + Math.random() * 8 };
  return { type: 'coupon', speed: 24 + Math.random() * 8 };
}

function itemPoints(type) {
  if (type === 'discount') return 12;
  if (type === 'coupon') return 22;
  return 0;
}

export default function FallingDealsGame() {
  const navigate = useNavigate();
  const [lane, setLane] = useState(2);
  const [items, setItems] = useState([]);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(35);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('');
  const [claimed, setClaimed] = useState(false);
  const idRef = useRef(0);
  const loopRef = useRef(null);
  const spawnRef = useRef(0);

  const resetGame = () => {
    setLane(2);
    setItems([]);
    setTimeLeft(35);
    setLives(3);
    setScore(0);
    setClaimed(false);
    setStatus('');
  };

  const endGame = async (finalScore) => {
    setRunning(false);
    if (!isAuthenticated() || finalScore <= 0 || claimed) return;

    const earned = Math.min(300, Math.floor(finalScore * 0.9));
    try {
      const { data } = await api.post('/game/runner-claim', { points: earned, gameKey: 'falling_deals' });
      setStatus(`Partida terminada. Ganaste ${data.earned} puntos. Saldo: ${data.newPoints}`);
      setClaimed(true);
    } catch (error) {
      setStatus(error.response?.data?.message || 'No se pudo reclamar puntos');
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!running) return;
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        setLane((prev) => Math.max(0, prev - 1));
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        setLane((prev) => Math.min(4, prev + 1));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [running]);

  useEffect(() => {
    if (!running) return undefined;

    let last = performance.now();

    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      spawnRef.current += dt;

      if (spawnRef.current > 0.45) {
        spawnRef.current = 0;
        const base = randomItem();
        setItems((prev) => [
          ...prev,
          { ...base, id: idRef.current++, lane: Math.floor(Math.random() * 5), y: -12 },
        ]);
      }

      setTimeLeft((prev) => Math.max(0, prev - dt));

      setItems((prev) => {
        const next = [];
        prev.forEach((item) => {
          const updated = { ...item, y: item.y + item.speed * dt };
          const collides = updated.lane === lane && updated.y >= 84 && updated.y <= 96;
          if (collides) {
            if (updated.type === 'bomb') {
              setLives((old) => Math.max(0, old - 1));
            } else {
              setScore((old) => old + itemPoints(updated.type));
            }
            return;
          }
          if (updated.y <= 110) next.push(updated);
        });
        return next;
      });

      loopRef.current = requestAnimationFrame(tick);
    };

    loopRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(loopRef.current);
  }, [running, lane]);

  useEffect(() => {
    if (!running) return;
    if (lives <= 0 || timeLeft <= 0) {
      endGame(score);
    }
  }, [lives, timeLeft, running, score]);

  return (
    <section className="content-stack">
      <section className="panel arcade-panel">
        <div className="panel__header">
          <h2>Caida de Chollos</h2>
          <Link className="btn btn--secondary" to="/games">
            Volver a juegos
          </Link>
        </div>
        <p>Esquiva bombas, recoge descuentos. Flechas izquierda/derecha para moverte.</p>

        <div className="arcade-hud">
          <span className="pill">Tiempo: {Math.ceil(timeLeft)}s</span>
          <span className="pill">Vidas: {lives}</span>
          <span className="pill">Puntuacion: {score}</span>
        </div>

        <div className="falling-board">
          {LANES.map((laneIndex) => (
            <div className="lane-line" key={`lane-${laneIndex}`} style={{ left: `${laneIndex * 20 + 10}%` }} />
          ))}

          <div className="runner-player" style={{ left: `${lane * 20 + 10}%` }}>
            <span>Tu</span>
          </div>

          {items.map((item) => (
            <div
              className={`falling-item falling-item--${item.type}`}
              key={item.id}
              style={{ left: `${item.lane * 20 + 10}%`, top: `${item.y}%` }}
            >
              {item.type === 'bomb' ? 'BOMB' : item.type === 'coupon' ? 'CUPON' : 'OFF'}
            </div>
          ))}
        </div>

        <div className="arcade-controls">
          <button className="btn btn--secondary" onClick={() => setLane((prev) => Math.max(0, prev - 1))} type="button">
            Izquierda
          </button>
          <button className="btn btn--secondary" onClick={() => setLane((prev) => Math.min(4, prev + 1))} type="button">
            Derecha
          </button>
        </div>

        {!running ? (
          <div className="actions">
            <button
              className="btn btn--epic"
              onClick={() => {
                resetGame();
                setRunning(true);
              }}
              type="button"
            >
              Empezar partida
            </button>
            {!isAuthenticated() && (
              <button className="btn btn--danger" onClick={() => navigate('/login')} type="button">
                Inicia sesion para ganar puntos
              </button>
            )}
          </div>
        ) : (
          <p className="alert">Partida en curso...</p>
        )}

        {status && <p className="alert alert--success">{status}</p>}
      </section>
    </section>
  );
}
