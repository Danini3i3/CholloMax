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
          <span className="sale-tag">LUCK</span>
          <h3>Ruleta Epica</h3>
          <p>Premios instantaneos: puntos, descuentos y envio gratis.</p>
          <Link className="btn btn--epic" to="/game">
            Jugar ruleta
          </Link>
        </article>

        <article className="panel game-card game-card--runner">
          <span className="sale-tag">SKILL</span>
          <h3>Caida de Chollos</h3>
          <p>Esquiva bombas, recoge descuentos y suma puntos por reflejos.</p>
          <Link className="btn btn--danger" to="/games/falling">
            Jugar arcade
          </Link>
        </article>

        <article className="panel game-card game-card--throw">
          <span className="sale-tag">DISTANCE</span>
          <h3>Lanzamiento Extremo</h3>
          <p>Lanza objetos lo mas lejos posible. Mayor distancia = mas puntos.</p>
          <Link className="btn btn--epic" to="/games/throw">
            Lanzar ahora
          </Link>
        </article>
      </div>
    </section>
  );
}
