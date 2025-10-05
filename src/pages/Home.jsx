import React from "react";
import "../styles/Home.css";
import HabitatDesigner from '../components/HabitatDesigner/HabitatDesigner.jsx';
import bg from "../resources/background.jpeg";

function Home() {
  return (
    <div className="home-container" style={{backgroundImage: `url(${bg})`}}>
      <div className="home-content">
        <h1>Bienvenido a Arkadia Space 🚀</h1>
        <p>Explorando el futuro del hábitat espacial.</p>
      </div>
    </div>
  );
}

export default Home;
