import React from "react";
import "../styles/BioArkadia.css";

function BioArkadia() {
  return (
    <div className="bioarkadia-calculator">
      <h2>Calculadora de Recursos</h2>
      <form
        onSubmit={e => {
          e.preventDefault();
          const crew = Number(e.target.crew.value);
          const months = Number(e.target.months.value);
          const foodM2 = crew * months * 2;
          const crewM2 = crew * 12;
          setResults({
            foodM2,
            crewM2,
            totalM2: foodM2 + crewM2,
          });
        }}
      >
        <label>
          Número de tripulantes:
          <input type="number" name="crew" min="1" required />
        </label>
        <br />
        <label>
          Meses de misión:
          <input type="number" name="months" min="1" required />
        </label>
        <br />
        <button type="submit">Calcular</button>
      </form>
      {results && (
        <div className="results">
          <p>Comida necesaria: <strong>{results.foodM2} m²</strong></p>
          <p>Espacio para tripulantes: <strong>{results.crewM2} m²</strong></p>
          <p>Espacio total utilizado: <strong>{results.totalM2} m²</strong></p>
        </div>
      )}
    </div>
  );
}

export default BioArkadia;