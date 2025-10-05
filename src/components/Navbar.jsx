import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import logo from "../resources/Colorway=2-Color White.svg";

function Navbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img
          src={logo}
          alt="Arkadia Space logo"
          className="navbar-logo"
          onClick={() => {
            navigate("/");
            closeMenu();
          }}
        />
        <span className="navbar-title">Arkadia Space</span>
      </div>

      <button className="menu-toggle" onClick={toggleMenu}>
        ☰
      </button>

      <ul className={`navbar-links ${isOpen ? "open" : ""}`}>
        <li><Link to="/" onClick={closeMenu}>Home</Link></li>
        <li><Link to="/habitat-designer" onClick={closeMenu}>Habitat Designer</Link></li>
        <li><Link to="/habitat-designer-b" onClick={closeMenu}>Vertical Habitat Designer (Demo)</Link></li>
        <li><Link to="/bio-arkadia" onClick={closeMenu}>BioArkadia</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
