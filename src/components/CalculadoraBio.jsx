import { useState } from 'react';

const CalculadoraMision = () => {
  const [tripulantes, setTripulantes] = useState('');
  const [meses, setMeses] = useState('');
  const [resultados, setResultados] = useState(null);

  const calcularMision = (e) => {
    e.preventDefault();
    
    if (!tripulantes || !meses || tripulantes <= 0 || meses <= 0) {
      alert('Por favor ingresa valores válidos mayores a 0');
      return;
    }

    const numTripulantes = parseInt(tripulantes);
    const numMeses = parseInt(meses);

    // Cálculos
    const comidaPorPersona = 5; // m³ por persona por mes
    const espacioPorTripulante = 20; // m³ por tripulante
    
    const comidaNecesaria = numTripulantes * numMeses * comidaPorPersona;
    const espacioTripulantes = numTripulantes * espacioPorTripulante;
    const espacioTotal = espacioTripulantes + comidaNecesaria;

    setResultados({
      comidaNecesaria,
      espacioTripulantes,
      espacioTotal
    });
  };

  const limpiarFormulario = () => {
    setTripulantes('');
    setMeses('');
    setResultados(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 py-8 px-4">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🚀 Space Mission Calculator
          </h1>
          <p className="text-blue-200">
            Take all the resources you need for you trip!
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={calcularMision} className="space-y-6">
          {/* Número de Tripulantes */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              👨‍🚀 Crew Number
            </label>
            <input
              type="number"
              value={tripulantes}
              onChange={(e) => setTripulantes(e.target.value)}
              min="1"
              max="100"
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              placeholder="Ej: 5"
              required
            />
          </div>

          {/* Meses de Misión */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              📅 Months of mission
            </label>
            <input
              type="number"
              value={meses}
              onChange={(e) => setMeses(e.target.value)}
              min="1"
              max="120"
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              placeholder="Ej: 12"
              required
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Calculate Mission
            </button>
            <button
              type="button"
              onClick={limpiarFormulario}
              className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transform hover:scale-105 transition-all duration-200"
            >
              Clean
            </button>
          </div>
        </form>

        {/* Resultados */}
        {resultados && (
          <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              📊 Summary for the mission
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg">
                <span className="text-blue-200">Total food needed:</span>
                <span className="text-white font-bold text-lg">
                  {resultados.comidaNecesaria} m³
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-500/20 rounded-lg">
                <span className="text-purple-200">Space required for the crew:</span>
                <span className="text-white font-bold text-lg">
                  {resultados.espacioTripulantes} m³
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-500/20 rounded-lg">
                <span className="text-green-200">Total space required:</span>
                <span className="text-white font-bold text-xl">
                  {resultados.espacioTotal} m³
                </span>
              </div>
            </div>

            {/* Resumen */}
            <div className="mt-6 p-4 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
              <p className="text-yellow-200 text-sm text-center">
                💡 <strong>Summary:</strong> For {tripulantes} crew members for {meses} months, 
                you need {resultados.espacioTotal} m³ of total space.
              </p>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-6 text-center">
          <p className="text-blue-300 text-xs">
            * Each crew member takes 20m³ + 5m³ of food per month.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CalculadoraMision;