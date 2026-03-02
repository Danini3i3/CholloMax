import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

const WHEEL_SEGMENTS = [
  { key: 'points', label: '+50 PTS', color: '#ff7f3f' },
  { key: 'discount', label: '10% OFF', color: '#ffd166' },
  { key: 'shipping', label: 'ENVIO FREE', color: '#4cc9f0' },
  { key: 'none', label: 'SIN PREMIO', color: '#8d99ae' },
  { key: 'points', label: 'BONUS PTS', color: '#f15bb5' },
  { key: 'discount', label: 'SUPER CUPON', color: '#80ed99' },
  { key: 'shipping', label: 'SHIP BOOST', color: '#9b5de5' },
  { key: 'none', label: 'RETRY', color: '#577590' },
];

function prizeText(prize) {
  if (!prize) return '';
  if (prize.type === 'points') return `Has ganado ${prize.amount} puntos`;
  if (prize.type === 'discount') return `Has ganado ${prize.amount}% de descuento`;
  if (prize.type === 'shipping') return 'Has ganado envio gratis';
  return 'Sin premio esta vez';
}

function translateApiMessage(msg) {
  const dictionary = {
    'Already played in last 24h': 'Ya jugaste recientemente.',
    'Not authorized, token missing': 'Falta iniciar sesion.',
    'Token invalid or expired': 'La sesion ha caducado. Vuelve a iniciar sesion.',
    'User not found': 'Usuario no encontrado.',
  };
  return dictionary[msg] || msg || 'No se pudo jugar';
}

function pickTargetSegment(prize) {
  const candidates = WHEEL_SEGMENTS
    .map((segment, index) => ({ ...segment, index }))
    .filter((segment) => segment.key === prize.type);

  if (candidates.length === 0) {
    return 0;
  }

  return candidates[Math.floor(Math.random() * candidates.length)].index;
}

function computeSpinDegrees(prevRotation, targetIndex) {
  const sector = 360 / WHEEL_SEGMENTS.length;
  const targetCenter = targetIndex * sector + sector / 2;
  const desired = (360 - targetCenter + 360) % 360;
  const current = ((prevRotation % 360) + 360) % 360;
  const delta = (desired - current + 360) % 360;
  const extraSpins = 8 * 360 + Math.floor(Math.random() * 120);
  return prevRotation + extraSpins + delta;
}

export default function Game() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [rotation, setRotation] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();

  const confettiPieces = useMemo(() => Array.from({ length: 30 }, (_, i) => i), []);

  const spin = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    setSpinning(true);
    setMessage('');
    setResult(null);
    setShowConfetti(false);

    try {
      const { data } = await api.post('/game/spin');
      const prize = data.prize;
      const target = pickTargetSegment(prize);

      setRotation((prev) => computeSpinDegrees(prev, target));

      window.setTimeout(() => {
        setResult(prize);
        if (prize.type !== 'none') {
          setShowConfetti(true);
          window.setTimeout(() => setShowConfetti(false), 2600);
        }
      }, 5100);
    } catch (error) {
      setMessage(translateApiMessage(error.response?.data?.message));
    } finally {
      window.setTimeout(() => setSpinning(false), 5200);
    }
  };

  return (
    <section className="panel game-panel game-panel--epic">
      <p className="kicker">Modo festival</p>
      <h2>Ruleta Epica de CholloMax</h2>
      <p className="game-subtitle">Luces, premios y giro brutal. Solo una partida cada 24 horas.</p>

      <div className="wheel-stage">
        <div className={`wheel-pointer${spinning ? ' wheel-pointer--live' : ''}`} />
        <div className="wheel-aura" />
        <div className="wheel-shell">
          <div className="wheel" style={{ transform: `rotate(${rotation}deg)` }}>
            <div className="wheel-gradient" />
            <div className="wheel-center">SPIN</div>
            {WHEEL_SEGMENTS.map((segment, index) => (
              <div
                className="wheel-label"
                key={`${segment.label}-${index}`}
                style={{
                  '--sector-angle': `${360 / WHEEL_SEGMENTS.length}deg`,
                  '--index': index,
                  '--segment-color': segment.color,
                }}
              >
                <span>{segment.label}</span>
              </div>
            ))}
          </div>
        </div>

        {showConfetti && (
          <div className="confetti" aria-hidden="true">
            {confettiPieces.map((piece) => (
              <span key={piece} />
            ))}
          </div>
        )}
      </div>

      <button className={`btn btn--xl btn--epic${spinning ? ' is-spinning' : ''}`} disabled={spinning} onClick={spin} type="button">
        {spinning ? 'Girando al maximo...' : 'Girar ruleta epica'}
      </button>

      {result && <p className="alert alert--success alert--epic">{prizeText(result)}</p>}
      {message && <p className="alert alert--error">{message}</p>}
    </section>
  );
}
