import React from 'react';
import { Link } from 'react-router-dom';

export default function GamesHub() {
  return (
    <section className="content-stack">
      <section className="panel games-hero">
        <p className="kicker">Arcade Zone</p>
        <h2>Seccion de Juegos</h2>
        <p>Gana puntos con minijuegos y canjealos por descuentos y cupones.</p>
      </section>

      <div className="games-grid">
        <article className="panel game-card">
          <img
            alt="Miniatura ruleta"
            className="game-thumb"
            src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80"
          />
          <span className="sale-tag">LUCK</span>
          <h3>Ruleta Epica</h3>
          <p>Premios instantaneos: puntos, descuentos y envio gratis.</p>
          <Link className="btn btn--epic" to="/game">
            Jugar ruleta
          </Link>
        </article>

        <article className="panel game-card game-card--runner">
          <img
            alt="Miniatura caida de chollos"
            className="game-thumb"
            src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80"
          />
          <span className="sale-tag">SKILL</span>
          <h3>Caida de Chollos</h3>
          <p>Esquiva bombas, recoge descuentos y suma puntos por reflejos.</p>
          <Link className="btn btn--danger" to="/games/falling">
            Jugar arcade
          </Link>
        </article>

        <article className="panel game-card game-card--throw">
          <img
            alt="Miniatura lanzamiento"
            className="game-thumb"
            src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80"
          />
          <span className="sale-tag">DISTANCE</span>
          <h3>Lanzamiento Extremo</h3>
          <p>Lanza objetos lo mas lejos posible. Mayor distancia = mas puntos.</p>
          <Link className="btn btn--epic" to="/games/throw">
            Lanzar ahora
          </Link>
        </article>

        <article className="panel game-card game-card--runner">
          <img
            alt="Miniatura reaction rush"
            className="game-thumb"
            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80"
          />
          <span className="sale-tag">REFLEX</span>
          <h3>Reaction Rush</h3>
          <p>Toca objetivos al vuelo durante 20 segundos para acumular puntos.</p>
          <Link className="btn btn--danger" to="/games/reaction">
            Jugar reaction
          </Link>
        </article>

        <article className="panel game-card">
          <img
            alt="Miniatura memory flip"
            className="game-thumb"
            src="https://images.unsplash.com/photo-1614851099511-773084f6911d?auto=format&fit=crop&w=900&q=80"
          />
          <span className="sale-tag">BRAIN</span>
          <h3>Memory Flip</h3>
          <p>Encuentra parejas. Menos movimientos = mas recompensa.</p>
          <Link className="btn btn--epic" to="/games/memory">
            Jugar memory
          </Link>
        </article>
      </div>
    </section>
  );
}
