import React from "react";
import { Link } from 'react-router-dom';
import "../styles/Navbar.css";
import { useNavigate } from "react-router-dom";
import logo from "../resources/Colorway=2-Color White.svg"; // cambia el nombre según tu imagen

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img
          src={logo}
          alt="Arkadia Space logo"
          className="navbar-logo"
          onClick={() => navigate("/")}
        />
        <span className="navbar-title">Arkadia Space</span>
      </div>

      <ul className="navbar-links">
        <li style={{marginLeft: 20}}><Link to="/">Inicio</Link></li>
        <li><Link to="/habitat-designer">Diseñador de Hábitats</Link></li>
        <li><Link to="/bio-arkadia">BioArkadia</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
