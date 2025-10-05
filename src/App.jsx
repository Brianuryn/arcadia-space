import React from "react";
/*import { BrowserRouter as Router, Routes, Route } from "react-router-dom";*/
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import HabitatDesigner from './components/HabitatDesigner';
import HabitatDesignerB from './components/HabitatDesignerVertical';
import Footer from "./components/Footer";
import BioArkadia from './components/CalculadoraBio';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/habitat-designer" element={<HabitatDesigner />} />
        <Route path="/habitat-designer-b" element={<HabitatDesignerB />} />
        <Route path="/bio-arkadia" element={<BioArkadia />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
