import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import HabitatDesigner from './pages/HabitatDesigner';
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/habitat-designer" element={<HabitatDesigner />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
