import React from "react";
import "./Header.css"; // CSSファイルをインポート

const Header = () => {
  return (
    <header className="header">
      <h1 className="logo">My Website</h1>
      <nav>
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
