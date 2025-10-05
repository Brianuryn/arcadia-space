import React, { useState, useCallback, useRef, useEffect } from 'react';

const HabitatDesignerB = () => {
  // Estados principales
  const [habitatConfig, setHabitatConfig] = useState({
    diameter: 30,
    height: 20,
    crewSize: 6,
    shape: 'cilindrica',
    showGrid: true,
    zoom: 1.0
  });
  
  const [modules, setModules] = useState([]);
  const [moduleToPlace, setModuleToPlace] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [draggedModule, setDraggedModule] = useState(null);
  const canvasRef = useRef(null);

  // Módulos disponibles - AHORA EN LISTA VERTICAL
  const availableModules = [
    { id: 'living-quarters', name: 'Living Quarters', type: 'interior', width: 6, height: 4, energyConsumption: -5, weight: 1500, icon: '🛏️' },
    { id: 'kitchen', name: 'Kitchen', type: 'interior', width: 4, height: 4, energyConsumption: -8, weight: 1200, icon: '🍳' },
    { id: 'lab', name: 'Laboratory', type: 'interior', width: 6, height: 5, energyConsumption: -12, weight: 2000, icon: '🔬' },
    { id: 'storage', name: 'Storage', type: 'interior', width: 5, height: 4, energyConsumption: -2, weight: 800, icon: '📦' },
    { id: 'water-storage', name: 'Water Storage', type: 'exterior', width: 4, height: 4, energyConsumption: -1, weight: 1000, icon: '💧' },
    { id: 'solar-panel', name: 'Solar Panels', type: 'exterior', width: 8, height: 4, energyConsumption: 25, weight: 500, icon: '☀️' },
    { id: 'nuclear-generator', name: 'Nuclear Generator', type: 'exterior', width: 6, height: 6, energyConsumption: 100, weight: 3000, icon: '⚛️' },
    { id: 'greenhouse', name: 'Greenhouse', type: 'interior', width: 8, height: 6, energyConsumption: -15, weight: 2500, icon: '🌱' },
    { id: 'airlock', name: 'Airlock', type: 'interior', width: 3, height: 3, energyConsumption: -3, weight: 800, icon: '🚪' },
    { id: 'comms', name: 'Communications', type: 'exterior', width: 3, height: 3, energyConsumption: -4, weight: 600, icon: '📡' }
  ];

  // Funciones de zoom
  const zoomIn = () => {
    setHabitatConfig(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 0.25, 2.0)
    }));
  };

  const zoomOut = () => {
    setHabitatConfig(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 0.25, 0.5)
    }));
  };

  const resetZoom = () => {
    setHabitatConfig(prev => ({
      ...prev,
      zoom: 1.0
    }));
  };

  // Sistema de coordenadas - AHORA PERMITE COLOCAR FUERA DEL HÁBITAT
  const getClickPosition = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, isValid: true }; // Siempre válido ahora

    const rect = canvas.getBoundingClientRect();
    const scale = 10 * habitatConfig.zoom;
    
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const habitatWidth = habitatConfig.diameter * scale;
    const habitatHeight = habitatConfig.shape === 'domo' ? habitatConfig.diameter * scale : habitatConfig.height * scale;
    
    const habitatStartX = centerX - habitatWidth / 2;
    const habitatStartY = centerY - habitatHeight / 2;
    
    const habitatX = (clickX - habitatStartX) / scale;
    const habitatY = (clickY - habitatStartY) / scale;

    // SIEMPRE es válido ahora - se puede colocar en cualquier parte del canvas
    return { x: habitatX, y: habitatY, isValid: true };
  };

  // Colocación de módulos - AHORA PERMITE COLOCAR EN CUALQUIER PARTE
  const handleCanvasClick = (e) => {
    if (!moduleToPlace || draggedModule) return;

    const position = getClickPosition(e.clientX, e.clientY);
    
    // No hay verificación de límites - se puede colocar en cualquier coordenada
    const newModule = {
      ...moduleToPlace,
      id: `${moduleToPlace.id}-${Date.now()}`,
      x: position.x,
      y: position.y
    };
    
    setModules(prev => [...prev, newModule]);
  };

  // MOVIMIENTO DE MÓDULOS
  const handleCanvasMouseDown = (e) => {
  
    if (e.ctrlKey || e.metaKey) return;

    const position = getClickPosition(e.clientX, e.clientY);

    const clickedModule = modules.find(module =>
      position.x >= module.x && position.x <= module.x + module.width &&
      position.y >= module.y && position.y <= module.y + module.height
    );

    if (clickedModule) {
      setSelectedModule(clickedModule);
      setModuleToPlace(null);
      setDraggedModule({
        module: clickedModule,
        offsetX: position.x - clickedModule.x,
        offsetY: position.y - clickedModule.y
      });
    } else {
      setSelectedModule(null);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggedModule) return;

    const position = getClickPosition(e.clientX, e.clientY);

    const newX = position.x - draggedModule.offsetX;
    const newY = position.y - draggedModule.offsetY;

    // SIN LÍMITES - se puede mover a cualquier coordenada
    setModules(prev => prev.map(module => 
      module.id === draggedModule.module.id 
        ? { ...module, x: newX, y: newY }
        : module
    ));
  };

  const handleCanvasMouseUp = () => {
    setDraggedModule(null);
  };

  // Dibujar el hábitat
  const drawHabitat = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const scale = 10 * habitatConfig.zoom;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fondo
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cuadrícula
    if (habitatConfig.showGrid) {
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.lineWidth = 1;
      
      const gridSize = scale;
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Centro del hábitat
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Dibujar forma del hábitat
    ctx.strokeStyle = '#4FD1C5';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(79, 209, 197, 0.1)';

    if (habitatConfig.shape === 'domo') {
      const radius = (habitatConfig.diameter * scale) / 2;
      
      // Base circular
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Domo
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
      ctx.stroke();
    } else {
      const width = habitatConfig.diameter * scale;
      const height = habitatConfig.height * scale;
      
      // Cuerpo principal
      ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
      ctx.strokeRect(centerX - width/2, centerY - height/2, width, height);
      
      // Extremos redondeados
      ctx.beginPath();
      ctx.arc(centerX - width/2, centerY, height/2, Math.PI/2, 3*Math.PI/2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(centerX + width/2, centerY, height/2, 3*Math.PI/2, Math.PI/2);
      ctx.stroke();
    }

    // Dibujar módulos - EN CUALQUIER POSICIÓN
    const habitatWidth = habitatConfig.diameter * scale;
    const habitatHeight = habitatConfig.shape === 'domo' ? habitatConfig.diameter * scale : habitatConfig.height * scale;
    const habitatStartX = centerX - habitatWidth / 2;
    const habitatStartY = centerY - habitatHeight / 2;

    modules.forEach(module => {
      const isSelected = selectedModule && selectedModule.id === module.id;
      
      const x = habitatStartX + module.x * scale;
      const y = habitatStartY + module.y * scale;
      const width = module.width * scale;
      const height = module.height * scale;

      const isInterior = module.type === 'interior';
      const fillColor = isInterior ? 'rgba(72, 187, 120, 0.7)' : 'rgba(237, 137, 54, 0.7)';
      const borderColor = isInterior ? '#48BB78' : '#ED8936';

      // Relleno y borde
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, width, height);

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.strokeRect(x, y, width, height);

      // Texto
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${12 * habitatConfig.zoom}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(module.icon, x + width / 2, y + height / 2 - 8);
      
      ctx.font = `${10 * habitatConfig.zoom}px Arial`;
      const energyText = module.energyConsumption > 0 ? `+${module.energyConsumption}kW` : `${module.energyConsumption}kW`;
      ctx.fillText(energyText, x + width / 2, y + height / 2 + 12);

      // Indicador de posición fuera del hábitat
      const isOutsideHabitat = module.x < 0 || module.y < 0 || 
                              module.x + module.width > habitatConfig.diameter ||
                              module.y + module.height > (habitatConfig.shape === 'domo' ? habitatConfig.diameter : habitatConfig.height);

      if (isOutsideHabitat) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]);
        
        // Indicador visual de módulo exterior
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.fillRect(x, y, width, height);
      }
    });

    // Mensaje de ayuda
    if (moduleToPlace) {
      ctx.fillStyle = 'rgba(96, 165, 250, 0.9)';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Ready to place: ${moduleToPlace.name} - Click anywhere to place`, centerX, 30);
    } else if (selectedModule) {
      ctx.fillStyle = 'rgba(72, 187, 120, 0.9)';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Selected module: ${selectedModule.name} - Drag to move`, centerX, 30);
    }

  }, [habitatConfig, modules, moduleToPlace, selectedModule]);

  // Funciones auxiliares
  const selectModuleToPlace = (module) => {
    setModuleToPlace(module);
    setSelectedModule(null);
  };

  const deleteSelectedModule = () => {
    if (selectedModule) {
      setModules(prev => prev.filter(module => module.id !== selectedModule.id));
      setSelectedModule(null);
    }
  };

  const clearAllModules = () => {
    if (window.confirm('Are you sure you want to delete all modules?')) {
      setModules([]);
      setSelectedModule(null);
      setModuleToPlace(null);
    }
  };

  // Efectos
  useEffect(() => {
    drawHabitat();
  }, [drawHabitat]);

  // Cálculos de estadísticas
  const totalCost = modules.reduce((sum, module) => sum + (module.weight * 10000), 0);
  const energyProduction = modules.reduce((sum, module) => sum + Math.max(0, module.energyConsumption), 0);
  const energyConsumption = modules.reduce((sum, module) => sum + Math.min(0, module.energyConsumption), 0);
  const energyBalance = energyProduction + energyConsumption;
  const energyDeficit = energyBalance < 0;

  // Contar módulos dentro y fuera del hábitat
  const modulesInside = modules.filter(module => {
    return module.x >= 0 && module.y >= 0 && 
           module.x + module.width <= habitatConfig.diameter &&
           module.y + module.height <= (habitatConfig.shape === 'domo' ? habitatConfig.diameter : habitatConfig.height);
  }).length;

  const modulesOutside = modules.length - modulesInside;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-purple-900 border-b-4 border-cyan-500 py-4">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Arkadia Space
          </h1>
          <p className="text-blue-200 mt-2">Habitat Designer</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Panel Lateral */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Módulos Disponibles - AHORA EN LISTA VERTICAL */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-cyan-400 mb-4 pb-2 border-b border-gray-700">
                Available Modules
              </h2>
              
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {availableModules.map(module => (
                  <button
                    key={module.id}
                    onClick={() => selectModuleToPlace(module)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      moduleToPlace?.id === module.id
                        ? 'border-cyan-500 bg-cyan-500/10 transform scale-[1.02]'
                        : 'border-gray-600 bg-gray-700/50 hover:border-cyan-400 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl flex-shrink-0">{module.icon}</div>
                      <div className="flex-grow">
                        <div className="font-semibold text-sm">{module.name}</div>
                        <div className="text-xs text-gray-400">{module.width}×{module.height}m</div>
                      </div>
                      <div className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${
                        module.energyConsumption > 0 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : 'bg-red-500/20 text-red-400 border border-red-500/50'
                      }`}>
                        {module.energyConsumption > 0 ? '+' : ''}{module.energyConsumption}kW
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {moduleToPlace && (
                <div className="bg-cyan-500/10 border border-cyan-500 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-cyan-300">Ready to place:</span>
                    <button
                      onClick={() => setModuleToPlace(null)}
                      className="text-cyan-300 hover:text-white bg-cyan-500/20 rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{moduleToPlace.icon}</span>
                    <span className="font-semibold">{moduleToPlace.name}</span>
                  </div>
                  <p className="text-cyan-200 text-sm mt-2">Click ANYWHERE in the area to place it</p>
                </div>
              )}
            </div>

            {/* Configuración del Hábitat */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-cyan-400 mb-4 pb-2 border-b border-gray-700">
                Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Habitat Shape
                  </label>
                  <select 
                    value={habitatConfig.shape}
                    onChange={(e) => setHabitatConfig(prev => ({...prev, shape: e.target.value}))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="cilindrica">Horizontal Cylinder</option>
                    <option value="domo">Vertical Cylinder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {habitatConfig.shape === 'domo' ? 'Diameter (meters)' : 'Length (meters)'}
                  </label>
                  <input
                    type="number"
                    value={habitatConfig.diameter}
                    onChange={(e) => setHabitatConfig(prev => ({...prev, diameter: parseInt(e.target.value) || 10}))}
                    min="10"
                    max="100"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {habitatConfig.shape === 'cilindrica' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Height (meters)
                    </label>
                    <input
                      type="number"
                      value={habitatConfig.height}
                      onChange={(e) => setHabitatConfig(prev => ({...prev, height: parseInt(e.target.value) || 10}))}
                      min="10"
                      max="50"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Crew Size
                  </label>
                  <input
                    type="number"
                    value={habitatConfig.crewSize}
                    onChange={(e) => setHabitatConfig(prev => ({...prev, crewSize: parseInt(e.target.value) || 0}))}
                    min="1"
                    max="50"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={habitatConfig.showGrid}
                    onChange={() => setHabitatConfig(prev => ({...prev, showGrid: !prev.showGrid}))}
                    className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                  />
                  <label className="text-sm font-medium text-gray-300">
                    Show grid
                  </label>
                </div>
              </div>

              {/* Controles de Zoom */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">View Zoom</h3>
                <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                  <button
                    onClick={zoomOut}
                    className="w-10 h-10 bg-gray-600 hover:bg-gray-500 rounded-lg flex items-center justify-center text-xl font-bold transition-colors"
                    title="Zoom Out"
                  >
                    −
                  </button>
                  <span className="font-bold text-lg min-w-[60px] text-center">
                    {Math.round(habitatConfig.zoom * 100)}%
                  </span>
                  <button
                    onClick={zoomIn}
                    className="w-10 h-10 bg-gray-600 hover:bg-gray-500 rounded-lg flex items-center justify-center text-xl font-bold transition-colors"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    onClick={resetZoom}
                    className="w-10 h-10 bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center justify-center text-lg font-bold transition-colors"
                    title="Reset Zoom"
                  >
                    ⟲
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Área Principal */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Información y Estadísticas */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Información del Módulo */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-cyan-400 mb-4">Module Information</h3>
                <div className="min-h-[200px]">
                  {selectedModule ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{selectedModule.icon}</span>
                        <div>
                          <h4 className="text-xl font-bold">{selectedModule.name}</h4>
                          <div className={`text-sm ${modulesOutside > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {modulesOutside > 0 ? '⚠️ Outside habitat' : '✓ Inside habitat'}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b border-gray-700">
                          <span className="text-gray-400">Type:</span>
                          <span>{selectedModule.type === 'interior' ? 'Interior' : 'Exterior'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-700">
                          <span className="text-gray-400">Dimensions:</span>
                          <span>{selectedModule.width} × {selectedModule.height} m</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-700">
                          <span className="text-gray-400">Weight:</span>
                          <span>{selectedModule.weight} kg</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-700">
                          <span className="text-gray-400">Cost:</span>
                          <span>${(selectedModule.weight * 10000).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-400">Energy:</span>
                          <span className={selectedModule.energyConsumption > 0 ? 'text-green-400' : 'text-red-400'}>
                            {selectedModule.energyConsumption > 0 ? '+' : ''}{selectedModule.energyConsumption} kW
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={deleteSelectedModule}
                        className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-semibold transition-colors"
                      >
                        Delete Module
                      </button>
                    </div>
                  ) : moduleToPlace ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{moduleToPlace.icon}</span>
                        <h4 className="text-xl font-bold">{moduleToPlace.name}</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b border-gray-700">
                          <span className="text-gray-400">Type:</span>
                          <span>{moduleToPlace.type === 'interior' ? 'Interior' : 'Exterior'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-700">
                          <span className="text-gray-400">Dimensions:</span>
                          <span>{moduleToPlace.width} × {moduleToPlace.height} m</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-700">
                          <span className="text-gray-400">Weight:</span>
                          <span>{moduleToPlace.weight} kg</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-700">
                          <span className="text-gray-400">Cost:</span>
                          <span>${(moduleToPlace.weight * 10000).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-400">Energy:</span>
                          <span className={moduleToPlace.energyConsumption > 0 ? 'text-green-400' : 'text-red-400'}>
                            {moduleToPlace.energyConsumption > 0 ? '+' : ''}{moduleToPlace.energyConsumption} kW
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      Select a module to view its information
                    </div>
                  )}
                </div>
              </div>

              {/* Estadísticas y Acciones */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-cyan-400 mb-4">Statistics</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-300">Total Cost</span>
                    <span className="font-bold text-lg">${totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-300">Energy Production</span>
                    <span className="font-bold text-lg text-green-400">{energyProduction} kW</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-300">Energy Consumption</span>
                    <span className="font-bold text-lg text-red-400">{energyConsumption} kW</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-300">Energy Balance</span>
                    <span className={`font-bold text-lg ${energyDeficit ? 'text-red-400' : 'text-green-400'}`}>
                      {energyBalance} kW
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-300">Total Modules</span>
                    <span className="font-bold text-lg">{modules.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-300">Inside Habitat</span>
                    <span className="font-bold text-lg text-green-400">{modulesInside}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-300">Outside Habitat</span>
                    <span className={`font-bold text-lg ${modulesOutside > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {modulesOutside}
                    </span>
                  </div>
                </div>

                {energyDeficit && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2 text-red-400">
                      <span>⚠️</span>
                      <span>Deficit of {Math.abs(energyBalance)} kW</span>
                    </div>
                  </div>
                )}

                {modulesOutside > 0 && (
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2 text-yellow-400">
                      <span>⚠️</span>
                      <span>{modulesOutside} module(s) outside habitat</span>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-3">Actions</h3>
                  <button
                    onClick={clearAllModules}
                    className="w-full bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Área de Diseño */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h2 className="text-xl font-bold text-cyan-400 mb-2 sm:mb-0">
                  Habitat View - {habitatConfig.shape === 'cilindrica' ? 'Horizontal Cylinder' : 'Vertical Cylinder'}
                </h2>
                <div className="flex flex-col sm:items-end space-y-1">
                  <span className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded">
                    Zoom: {Math.round(habitatConfig.zoom * 100)}% • Grid: {habitatConfig.showGrid ? 'ON' : 'OFF'}
                  </span>
                  <span className="text-sm text-cyan-300">
                    {moduleToPlace 
                      ? 'Click ANYWHERE to place the module' 
                      : selectedModule 
                      ? 'Drag to move'
                      : 'Select a module to begin'
                    }
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={400}
                  onClick={handleCanvasClick}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className="w-full h-full cursor-crosshair"
                />
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default HabitatDesignerB;