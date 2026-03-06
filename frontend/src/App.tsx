import React, { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import ProductPage from './components/ProductPage';
import Cart from './components/Cart';
import Profile from './components/Profile';
import Game from './components/Game';
import PointsHub from './components/PointsHub';
import MyOrders from './components/MyOrders';
import OrderDetail from './components/OrderDetail';
import GamesHub from './components/GamesHub';
import FallingDealsGame from './components/FallingDealsGame';
import ThrowDistanceGame from './components/ThrowDistanceGame';
import ReactionRushGame from './components/ReactionRushGame';
import MemoryFlipGame from './components/MemoryFlipGame';
import ClickFrenzyGame from './components/ClickFrenzyGame';
import DealHunterGame from './components/DealHunterGame';
import DuelArenaGame from './components/DuelArenaGame';
import RtxTunnelGame from './components/RtxTunnelGame';
import TermsConditions from './components/TermsConditions';
import AdminPanel from './components/AdminPanel';
import { clearToken, getToken, isAdmin } from './lib/session';

const navClassName = ({ isActive }) => `top-nav__link${isActive ? ' top-nav__link--active' : ''}`;

function App() {
  const [token, setToken] = useState(getToken());
  const [ageGateOpen, setAgeGateOpen] = useState(() => window.localStorage.getItem('age_confirmed_18') !== '1');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();
  const adminVisible = token && isAdmin();

  useEffect(() => {
    const syncAuth = () => setToken(getToken());
    window.addEventListener('auth-changed', syncAuth);
    return () => window.removeEventListener('auth-changed', syncAuth);
  }, []);

  const logout = () => {
    clearToken();
    setToken(null);
    navigate('/login');
  };

  const confirmAge = () => {
    if (!termsAccepted) return;
    window.localStorage.setItem('age_confirmed_18', '1');
    setAgeGateOpen(false);
  };

  const rejectAge = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="app-shell">
      <header className="top-nav">
        <Link className="brand" to="/">
          CholloMax
        </Link>
        <nav className="top-nav__links">
          <NavLink className={navClassName} to="/">
            Inicio
          </NavLink>
          <NavLink className={navClassName} to="/cart">
            Carrito
          </NavLink>
          <NavLink className={navClassName} to="/games">
            Juegos
          </NavLink>
          <NavLink className={navClassName} to="/points">
            Puntos
          </NavLink>
          <NavLink className={navClassName} to="/terms">
            Términos
          </NavLink>
          {adminVisible && (
            <NavLink className={navClassName} to="/admin">
              Admin
            </NavLink>
          )}
          {token ? (
            <>
              <NavLink className={navClassName} to="/orders">
                Mis pedidos
              </NavLink>
              <NavLink className={navClassName} to="/profile">
                Perfil
              </NavLink>
              <button className="btn btn--ghost" onClick={logout} type="button">
                Salir
              </button>
            </>
          ) : (
            <div className="auth-nav-group" role="group" aria-label="Acceso">
              <NavLink className={navClassName} to="/login">
                Login
              </NavLink>
              <span className="auth-nav-separator">|</span>
              <NavLink className={navClassName} to="/register">
                Registro
              </NavLink>
            </div>
          )}
        </nav>
      </header>
      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/game" element={<Game />} />
          <Route path="/games" element={<GamesHub />} />
          <Route path="/games/falling" element={<FallingDealsGame />} />
          <Route path="/games/throw" element={<ThrowDistanceGame />} />
          <Route path="/games/reaction" element={<ReactionRushGame />} />
          <Route path="/games/memory" element={<MemoryFlipGame />} />
          <Route path="/games/click-frenzy" element={<ClickFrenzyGame />} />
          <Route path="/games/deal-hunter" element={<DealHunterGame />} />
          <Route path="/games/duel-arena" element={<DuelArenaGame />} />
          <Route path="/games/rtx-tunnel" element={<RtxTunnelGame />} />
          <Route path="/points" element={<PointsHub />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>

      {ageGateOpen && (
        <div className="popup-overlay popup-overlay--epic" role="dialog" aria-modal="true">
          <article className="popup-card popup-card--promo age-popup">
            <p className="kicker">Acceso restringido</p>
            <h3>Confirmación +18</h3>
            <p>Debes confirmar que tienes 18 años o más para continuar en CholloMax.</p>
            <label className="terms-check">
              <input checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} type="checkbox" />
              <span>
                Acepto los <Link to="/terms">Términos y Condiciones</Link>.
              </span>
            </label>
            <div className="actions">
              <button className="btn btn--epic" disabled={!termsAccepted} onClick={confirmAge} type="button">
                Soy mayor de 18
              </button>
              <button className="btn btn--danger" onClick={rejectAge} type="button">
                Salir
              </button>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}

export default App;
