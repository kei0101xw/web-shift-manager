import React, { useState } from "react";
import "./Header.css";
import logo from "../assets/logo_trans.png";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const goToHome = () => {
    navigate(user?.role === "admin" ? "/managerhome" : "/home");
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header">
      <img
        src={logo}
        alt="ロゴ画像"
        className="header-logo"
        onClick={goToHome}
      />
      <button className="hamburger" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>
      <nav className={`nav ${menuOpen ? "open" : ""}`}>
        <ul className="nav-list">
          <li>
            <Link
              to={user?.role === "admin" ? "/managerhome" : "/home"}
              className="nav-item"
              onClick={() => setMenuOpen(false)} // メニュー閉じる
            >
              Home
            </Link>
          </li>
          <li>
            <Link to="/profile" className="nav-item">
              Profile
            </Link>
          </li>
          <li>
            <button onClick={handleLogout} className="nav-item logout-button">
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
