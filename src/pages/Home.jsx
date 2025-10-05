import React from "react";
import "../styles/Home.css";
import HabitatDesigner from '../components/HabitatDesigner.jsx';
import bg from "../resources/background.jpeg";

function Home() {
  return (
    <div className="home-container" style={{backgroundImage: `url(${bg})`}}>
      <div className="home-content">
        <h1>Wellcome to Arkadia Space 🚀</h1>
        <p>Exploring the future of space habitat.</p>
      </div>
    </div>
  );
}

export default Home;
