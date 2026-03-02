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
import { clearToken, getToken } from './lib/session';

const navClassName = ({ isActive }) => `top-nav__link${isActive ? ' top-nav__link--active' : ''}`;

function App() {
  const [token, setToken] = useState(getToken());
  const navigate = useNavigate();

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
          <NavLink className={navClassName} to="/game">
            Ruleta
          </NavLink>
          <NavLink className={navClassName} to="/points">
            Puntos
          </NavLink>
          {token ? (
            <>
              <NavLink className={navClassName} to="/profile">
                Perfil
              </NavLink>
              <button className="btn btn--ghost" onClick={logout} type="button">
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink className={navClassName} to="/login">
                Login
              </NavLink>
              <NavLink className={navClassName} to="/register">
                Registro
              </NavLink>
            </>
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/game" element={<Game />} />
          <Route path="/points" element={<PointsHub />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
