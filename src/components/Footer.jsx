import React from "react";
import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Arkadia Space — All rights reserved.</p>
    </footer>
  );
}

export default Footer;
