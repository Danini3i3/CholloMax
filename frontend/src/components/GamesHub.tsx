import React from 'react';
import { Link } from 'react-router-dom';

export default function GamesHub() {
  return (
    <section className="content-stack">
      <section className="panel games-hero">
        <p className="kicker">Arcade Zone</p>
        <h2>Sección de Juegos</h2>
        <p>Gana puntos con minijuegos y canjéalos por descuentos y cupones.</p>
      </section>

      <div className="games-grid">
        <article className="panel game-card">
          <img
            alt="Miniatura ruleta"
            className="game-thumb"
            src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80"
          />
          <span className="sale-tag">LUCK</span>
          <h3>Ruleta Épica</h3>
          <p>Premios instantáneos: puntos, descuentos y envío gratis.</p>
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
          <h3>Caída de Chollos</h3>
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
          <p>Lanza objetos lo más lejos posible. Mayor distancia = más puntos.</p>
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
          <p>Encuentra parejas. Menos movimientos = más recompensa.</p>
          <Link className="btn btn--epic" to="/games/memory">
            Jugar memory
          </Link>
        </article>

        <article className="panel game-card game-card--throw">
          <img
            alt="Miniatura click frenzy"
            className="game-thumb"
            src="https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=900&q=80"
          />
          <span className="sale-tag">SPEED</span>
          <h3>Click Frenzy</h3>
          <p>Ronda de 12 segundos. Haz spam de clicks para sumar puntos rápidos.</p>
          <Link className="btn btn--danger" to="/games/click-frenzy">
            Jugar frenzy
          </Link>
        </article>

        <article className="panel game-card game-card--runner">
          <img
            alt="Miniatura deal hunter"
            className="game-thumb"
            src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80"
          />
          <span className="sale-tag">PRICE</span>
          <h3>Deal Hunter</h3>
          <p>Adivina el precio secreto de cada ronda. Cuanto más cerca, mejor premio.</p>
          <Link className="btn btn--epic" to="/games/deal-hunter">
            Cazar chollo
          </Link>
        </article>

        <article className="panel game-card">
          <img
            alt="Miniatura duel arena"
            className="game-thumb"
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80"
          />
          <span className="sale-tag">PVP</span>
          <h3>Duel Arena</h3>
          <p>Modo multijugador local: J1 con A y J2 con L, gana quien más pulse.</p>
          <Link className="btn btn--danger" to="/games/duel-arena">
            Jugar multi
          </Link>
        </article>

        <article className="panel game-card game-card--throw">
          <img
            alt="Miniatura rtx tunnel"
            className="game-thumb"
            src="https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=80"
          />
          <span className="sale-tag">RTX</span>
          <h3>RTX Tunnel 3D</h3>
          <p>Modo visual neón estilo raytrace. Esquiva beams y recoge boosts.</p>
          <Link className="btn btn--epic" to="/games/rtx-tunnel">
            Jugar RTX
          </Link>
        </article>
      </div>
    </section>
  );
}
