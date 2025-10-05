import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import BioArkadia from "./pages/BioArkadia";
import HabitatDesigner from './components/HabitatDesigner';
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/habitat-designer" element={<HabitatDesigner />} />
        <Route path="/bio-arkadia" element={<BioArkadia />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
