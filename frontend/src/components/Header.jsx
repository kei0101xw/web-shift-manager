import React, { useState } from "react";
import "./Header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="header">
      <h1 className="logo">シジャン博多一番街店</h1>
      <button className="hamburger" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>
      <nav className={`nav ${menuOpen ? "open" : ""}`}>
        <ul className="nav-list">
          <li>
            <a href="/" className="nav-item">
              Home
            </a>
          </li>
          <li>
            <a href="/about" className="nav-item">
              About
            </a>
          </li>
          <li>
            <a href="/contact" className="nav-item">
              Contact
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
