import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { isAuthenticated } from '../lib/session';

function randomObstacle() {
  return {
    x: -1 + Math.random() * 2,
    z: 1,
    speed: 0.45 + Math.random() * 0.3,
    kind: Math.random() < 0.75 ? 'beam' : 'boost',
  };
}

export default function RtxTunnelGame() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const obstaclesRef = useRef([]);
  const playerXRef = useRef(0);
  const timeRef = useRef(28);
  const runningRef = useRef(false);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);

  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(28);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('');
  const [claimed, setClaimed] = useState(false);

  const endRun = () => {
    runningRef.current = false;
    setRunning(false);
  };

  const start = () => {
    obstaclesRef.current = [];
    playerXRef.current = 0;
    timeRef.current = 28;
    livesRef.current = 3;
    scoreRef.current = 0;
    setTimeLeft(28);
    setLives(3);
    setScore(0);
    setStatus('');
    setClaimed(false);
    runningRef.current = true;
    setRunning(true);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!runningRef.current) return;
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        playerXRef.current = Math.max(-1, playerXRef.current - 0.16);
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        playerXRef.current = Math.min(1, playerXRef.current + 0.16);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    let last = performance.now();
    let spawnAcc = 0;

    const render = (now) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const dt = Math.min(0.035, (now - last) / 1000);
      last = now;

      ctx.fillStyle = '#050914';
      ctx.fillRect(0, 0, w, h);

      const grad = ctx.createRadialGradient(w * 0.5, h * 0.48, 30, w * 0.5, h * 0.52, w * 0.65);
      grad.addColorStop(0, 'rgba(41, 128, 255, 0.22)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 18; i += 1) {
        const depth = (i / 18 + (now * 0.00015) % 1) % 1;
        const radius = 20 + depth * w * 0.5;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(94, 181, 255, ${0.14 * (1 - depth)})`;
        ctx.lineWidth = 1;
        ctx.ellipse(w / 2, h * 0.56, radius, radius * 0.48, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (runningRef.current) {
        spawnAcc += dt;
        timeRef.current = Math.max(0, timeRef.current - dt);
        if (spawnAcc > 0.34) {
          spawnAcc = 0;
          obstaclesRef.current.push(randomObstacle());
        }

        const remaining = [];
        obstaclesRef.current.forEach((ob) => {
          ob.z -= ob.speed * dt;
          if (ob.z > -0.05) remaining.push(ob);

          const nearPlayer = ob.z < 0.1;
          const hit = Math.abs(ob.x - playerXRef.current) < 0.2;
          if (nearPlayer && hit) {
            if (ob.kind === 'beam') {
              livesRef.current = Math.max(0, livesRef.current - 1);
            } else {
              scoreRef.current += 18;
            }
            ob.z = -1;
          }
        });
        obstaclesRef.current = remaining;
        scoreRef.current += dt * 6;

        if (livesRef.current <= 0 || timeRef.current <= 0) {
          endRun();
        }

        setTimeLeft(Math.ceil(timeRef.current));
        setLives(livesRef.current);
        setScore(Math.floor(scoreRef.current));
      }

      const drawObj = (ob) => {
        const depth = Math.max(0.02, ob.z);
        const scale = 1 - depth;
        const x = w / 2 + ob.x * (90 + scale * 220);
        const y = h * (0.22 + scale * 0.62);
        const size = 8 + scale * 32;

        ctx.beginPath();
        if (ob.kind === 'beam') {
          ctx.fillStyle = 'rgba(255, 90, 110, 0.9)';
          ctx.rect(x - size * 0.2, y - size, size * 0.4, size * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(73, 241, 194, 0.95)';
          ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      obstaclesRef.current.forEach(drawObj);

      const px = w / 2 + playerXRef.current * 240;
      const py = h - 38;
      ctx.fillStyle = '#ffd17b';
      ctx.beginPath();
      ctx.moveTo(px, py - 16);
      ctx.lineTo(px - 16, py + 14);
      ctx.lineTo(px + 16, py + 14);
      ctx.closePath();
      ctx.fill();

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const claim = async () => {
    if (running) {
      setStatus('Termina la partida para reclamar.');
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

    const earned = Math.min(300, Math.max(0, Math.floor(score * 0.9)));
    if (earned <= 0) {
      setStatus('Necesitas mas puntuacion.');
      return;
    }

    try {
      const { data } = await api.post('/game/runner-claim', {
        points: earned,
        gameKey: 'rtx_tunnel_3d',
      });
      setStatus(`RTX Tunnel: +${data.earned} puntos. Saldo: ${data.newPoints}`);
      setClaimed(true);
    } catch (error) {
      setStatus(error.response?.data?.message || 'No se pudo reclamar');
    }
  };

  return (
    <section className="content-stack">
      <section className="panel arcade-panel rtx-panel">
        <div className="panel__header">
          <h2>RTX Tunnel 3D</h2>
          <Link className="btn btn--secondary" to="/games">
            Volver
          </Link>
        </div>
        <p>Esquiva beams y recoge boosts. Controles: izquierda/derecha o A/D.</p>

        <div className="arcade-hud">
          <span className="pill">Tiempo: {timeLeft}s</span>
          <span className="pill">Vidas: {lives}</span>
          <span className="pill">Puntuacion: {score}</span>
        </div>

        <div className="rtx-stage">
          <canvas className="rtx-canvas" height="360" ref={canvasRef} width="760" />
        </div>

        <div className="actions">
          {!running ? (
            <button className="btn btn--epic" onClick={start} type="button">
              Iniciar RTX
            </button>
          ) : (
            <p className="alert">Render en tiempo real...</p>
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
