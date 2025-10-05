import React, { useState, useCallback, useRef, useEffect } from 'react';
import './HabitatDesigner.css';

const HabitatDesigner = () => {
  const [habitatConfig, setHabitatConfig] = useState({
    diameter: 30,
    height: 20,
    crewSize: 6,
    shape: 'cilindrica',
    showGrid: true,
    zoom: 1.0
  });
  
  const [modules, setModules] = useState([]);
  const [moduleToPlace, setModuleToPlace] = useState(null); // Módulo seleccionado para COLOCAR
  const [selectedModule, setSelectedModule] = useState(null); // Módulo seleccionado para MOVER/ELIMINAR
  const [draggedModule, setDraggedModule] = useState(null);
  const canvasRef = useRef(null);

  // Módulos disponibles
  const availableModules = [
    { id: 'living-quarters', name: 'Habitaciones', type: 'interior', width: 6, height: 4, energyConsumption: -5, weight: 1500, icon: '🛏️' },
    { id: 'kitchen', name: 'Cocina', type: 'interior', width: 4, height: 4, energyConsumption: -8, weight: 1200, icon: '🍳' },
    { id: 'lab', name: 'Laboratorio', type: 'interior', width: 6, height: 5, energyConsumption: -12, weight: 2000, icon: '🔬' },
    { id: 'storage', name: 'Almacenamiento', type: 'interior', width: 5, height: 4, energyConsumption: -2, weight: 800, icon: '📦' },
    { id: 'water-storage', name: 'Almacenamiento de Agua', type: 'exterior', width: 4, height: 4, energyConsumption: -1, weight: 1000, icon: '💧' },
    { id: 'solar-panel', name: 'Paneles Solares', type: 'exterior', width: 8, height: 4, energyConsumption: 25, weight: 500, icon: '☀️' },
    { id: 'nuclear-generator', name: 'Generador Nuclear', type: 'exterior', width: 6, height: 6, energyConsumption: 100, weight: 3000, icon: '⚛️' },
    { id: 'greenhouse', name: 'Invernadero', type: 'interior', width: 8, height: 6, energyConsumption: -15, weight: 2500, icon: '🌱' },
    { id: 'airlock', name: 'Eslúa', type: 'interior', width: 3, height: 3, energyConsumption: -3, weight: 800, icon: '🚪' },
    { id: 'comms', name: 'Comunicaciones', type: 'exterior', width: 3, height: 3, energyConsumption: -4, weight: 600, icon: '📡' }
  ];

  // Funciones de zoom
  const zoomIn = useCallback(() => {
    setHabitatConfig(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 0.25, 2.0)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setHabitatConfig(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 0.25, 0.5)
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setHabitatConfig(prev => ({
      ...prev,
      zoom: 1.0
    }));
  }, []);

  // COLOCACIÓN - Solo cuando tenemos un moduleToPlace
  const handleCanvasClick = (e) => {
    // Solo colocar si tenemos un módulo para colocar Y no estamos arrastrando
    if (!moduleToPlace || draggedModule) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = 10 * habitatConfig.zoom;
    
    // Posición absoluta del click
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Centro del canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Tamaño del hábitat en píxeles
    const habitatWidth = habitatConfig.diameter * scale;
    const habitatHeight = habitatConfig.shape === 'domo' ? habitatConfig.diameter * scale : habitatConfig.height * scale;
    
    // Esquina superior izquierda del hábitat
    const habitatStartX = centerX - habitatWidth / 2;
    const habitatStartY = centerY - habitatHeight / 2;
    
    // Verificar si el click está dentro del hábitat
    if (clickX < habitatStartX || clickX > habitatStartX + habitatWidth ||
        clickY < habitatStartY || clickY > habitatStartY + habitatHeight) {
      return;
    }
    
    // Convertir a coordenadas del hábitat (metros)
    const habitatX = (clickX - habitatStartX) / scale;
    const habitatY = (clickY - habitatStartY) / scale;
    
    // Ajustar para que el módulo quepa
    const maxX = habitatConfig.diameter - moduleToPlace.width;
    const maxY = habitatConfig.shape === 'domo' ? habitatConfig.diameter - moduleToPlace.height : habitatConfig.height - moduleToPlace.height;
    
    const adjustedX = Math.max(0, Math.min(habitatX, maxX));
    const adjustedY = Math.max(0, Math.min(habitatY, maxY));
    
    // COLOCAR EL MÓDULO
    const newModule = {
      ...moduleToPlace,
      id: `${moduleToPlace.id}-${Date.now()}`,
      x: adjustedX,
      y: adjustedY
    };
    
    setModules(prev => [...prev, newModule]);
  };

  // MOVIMIENTO DE MÓDULOS - Solo para módulos existentes
  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = 10 * habitatConfig.zoom;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const habitatWidth = habitatConfig.diameter * scale;
    const habitatHeight = habitatConfig.shape === 'domo' ? habitatConfig.diameter * scale : habitatConfig.height * scale;
    const habitatStartX = centerX - habitatWidth / 2;
    const habitatStartY = centerY - habitatHeight / 2;
    
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convertir a coordenadas del hábitat
    const habitatX = (clickX - habitatStartX) / scale;
    const habitatY = (clickY - habitatStartY) / scale;
    
    // Buscar módulo en la posición del clic
    const clickedModule = modules.find(module =>
      habitatX >= module.x && habitatX <= module.x + module.width &&
      habitatY >= module.y && habitatY <= module.y + module.height
    );

    if (clickedModule) {
      // Seleccionar para mover/eliminar
      setSelectedModule(clickedModule);
      // Limpiar la selección para colocar
      setModuleToPlace(null);
      
      setDraggedModule({
        module: clickedModule,
        offsetX: habitatX - clickedModule.x,
        offsetY: habitatY - clickedModule.y
      });
    } else {
      // Si se hace clic en área vacía, deseleccionar todo
      setSelectedModule(null);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggedModule) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = 10 * habitatConfig.zoom;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const habitatWidth = habitatConfig.diameter * scale;
    const habitatHeight = habitatConfig.shape === 'domo' ? habitatConfig.diameter * scale : habitatConfig.height * scale;
    const habitatStartX = centerX - habitatWidth / 2;
    const habitatStartY = centerY - habitatHeight / 2;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const habitatX = (mouseX - habitatStartX) / scale;
    const habitatY = (mouseY - habitatStartY) / scale;

    const newX = habitatX - draggedModule.offsetX;
    const newY = habitatY - draggedModule.offsetY;

    // Verificar límites
    const maxX = habitatConfig.diameter - draggedModule.module.width;
    const maxY = habitatConfig.shape === 'domo' ? habitatConfig.diameter - draggedModule.module.height : habitatConfig.height - draggedModule.module.height;

    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));

    setModules(prev => prev.map(module => 
      module.id === draggedModule.module.id 
        ? { ...module, x: clampedX, y: clampedY }
        : module
    ));
  };

  const handleCanvasMouseUp = () => {
    setDraggedModule(null);
  };

  // Dibujar el hábitat y módulos
  const drawHabitat = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const scale = 10 * habitatConfig.zoom;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar fondo
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar cuadrícula si está activada
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

    // Calcular posición central del hábitat
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
      
      // Domo (semi-círculo superior)
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
      ctx.stroke();
    } else {
      // Cilíndrica
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

    // Dibujar módulos
    const habitatWidth = habitatConfig.diameter * scale;
    const habitatHeight = habitatConfig.shape === 'domo' ? habitatConfig.diameter * scale : habitatConfig.height * scale;
    const habitatStartX = centerX - habitatWidth / 2;
    const habitatStartY = centerY - habitatHeight / 2;

    modules.forEach(module => {
      const isSelected = selectedModule && selectedModule.id === module.id;
      
      // Calcular posición en píxeles
      const x = habitatStartX + module.x * scale;
      const y = habitatStartY + module.y * scale;
      const width = module.width * scale;
      const height = module.height * scale;

      const isInterior = module.type === 'interior';
      const fillColor = isInterior ? 'rgba(72, 187, 120, 0.7)' : 'rgba(237, 137, 54, 0.7)';
      const borderColor = isInterior ? '#48BB78' : '#ED8936';

      // Relleno
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, width, height);

      // Borde
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.strokeRect(x, y, width, height);

      // Texto e icono
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${12 * habitatConfig.zoom}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(module.icon, x + width / 2, y + height / 2 - 8);
      
      // Indicador de energía
      ctx.font = `${10 * habitatConfig.zoom}px Arial`;
      const energyText = module.energyConsumption > 0 ? `+${module.energyConsumption}kW` : `${module.energyConsumption}kW`;
      ctx.fillText(energyText, x + width / 2, y + height / 2 + 12);
    });

    // Dibujar información de ayuda
    if (moduleToPlace) {
      ctx.fillStyle = 'rgba(96, 165, 250, 0.9)';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Módulo listo: ${moduleToPlace.name} - Haz clic en el hábitat para colocarlo`, centerX, 30);
    } else if (selectedModule) {
      ctx.fillStyle = 'rgba(72, 187, 120, 0.9)';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Módulo seleccionado: ${selectedModule.name} - Arrastra para mover`, centerX, 30);
    }

  }, [habitatConfig, modules, moduleToPlace, selectedModule]);

  // Funciones auxiliares
  const selectModuleToPlace = useCallback((module) => {
    setModuleToPlace(module);
    setSelectedModule(null); // Limpiar selección de módulo existente
  }, []);

  const deleteSelectedModule = useCallback(() => {
    if (selectedModule) {
      setModules(prev => prev.filter(module => module.id !== selectedModule.id));
      setSelectedModule(null);
    }
  }, [selectedModule]);

  const updateHabitatConfig = useCallback((newConfig) => {
    setHabitatConfig(newConfig);
  }, []);

  const clearAllModules = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todos los módulos?')) {
      setModules([]);
      setSelectedModule(null);
      setModuleToPlace(null);
    }
  }, []);

  // Redibujar cuando cambie la configuración o módulos
  useEffect(() => {
    drawHabitat();
  }, [drawHabitat]);

  // Cálculos de estadísticas
  const totalCost = modules.reduce((sum, module) => sum + (module.weight * 10000), 0);
  const energyProduction = modules.reduce((sum, module) => sum + Math.max(0, module.energyConsumption), 0);
  const energyConsumption = modules.reduce((sum, module) => sum + Math.min(0, module.energyConsumption), 0);
  const energyBalance = energyProduction + energyConsumption;
  const energyDeficit = energyBalance < 0;

  return (
    <div className="arkadia-designer">
      <header className="arkadia-header">
        <div className="header-content">
          <h1>Arkadia Space</h1>
          <p>Diseñador de Hábitats Lunares</p>
        </div>
      </header>

      <div className="designer-layout">
        <div className="control-panel">
          {/* MÓDULOS PARA COLOCAR */}
          <section className="modules-section">
            <h2>Módulos Disponibles</h2>
            <div className="modules-grid">
              {availableModules.map(module => (
                <button
                  key={module.id}
                  className={`module-button ${moduleToPlace?.id === module.id ? 'selected-to-place' : ''}`}
                  onClick={() => selectModuleToPlace(module)}
                >
                  <div className="module-button-content">
                    <span className="module-icon">{module.icon}</span>
                    <span className="module-name">{module.name}</span>
                    <span className="module-dims">{module.width}×{module.height}m</span>
                    <span className={`module-energy ${module.energyConsumption > 0 ? 'energy-positive' : 'energy-negative'}`}>
                      {module.energyConsumption > 0 ? '+' : ''}{module.energyConsumption}kW
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            {moduleToPlace && (
              <div className="selected-module-info place-mode">
                <p><strong>Módulo listo para colocar:</strong></p>
                <div className="selected-module">
                  <span className="module-icon">{moduleToPlace.icon}</span>
                  <span className="module-name">{moduleToPlace.name}</span>
                  <button 
                    className="clear-selection"
                    onClick={() => setModuleToPlace(null)}
                  >
                    ×
                  </button>
                </div>
                <p className="selection-hint">¡Haz clic en el hábitat para colocar el módulo!</p>
              </div>
            )}
          </section>

          <section className="config-section">
            <h2>Configuración del Hábitat</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Forma del Hábitat:</label>
                <select 
                  value={habitatConfig.shape}
                  onChange={(e) => updateHabitatConfig({...habitatConfig, shape: e.target.value})}
                  className="form-select"
                >
                  <option value="cilindrica">Cilíndrica Horizontal</option>
                  <option value="domo">Domo</option>
                </select>
              </div>

              <div className="form-group">
                <label>{habitatConfig.shape === 'domo' ? 'Diámetro (metros):' : 'Largo (metros):'}</label>
                <input
                  type="number"
                  value={habitatConfig.diameter}
                  onChange={(e) => updateHabitatConfig({...habitatConfig, diameter: parseInt(e.target.value) || 10})}
                  min="10"
                  max="100"
                  className="form-input"
                />
              </div>

              {habitatConfig.shape === 'cilindrica' && (
                <div className="form-group">
                  <label>Altura (metros):</label>
                  <input
                    type="number"
                    value={habitatConfig.height}
                    onChange={(e) => updateHabitatConfig({...habitatConfig, height: parseInt(e.target.value) || 10})}
                    min="10"
                    max="50"
                    className="form-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Tamaño de la tripulación:</label>
                <input
                  type="number"
                  value={habitatConfig.crewSize}
                  onChange={(e) => updateHabitatConfig({...habitatConfig, crewSize: parseInt(e.target.value) || 0})}
                  min="1"
                  max="50"
                  className="form-input"
                />
              </div>
            </div>

            <div className="toggle-group">
              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={habitatConfig.showGrid}
                  onChange={() => updateHabitatConfig({...habitatConfig, showGrid: !habitatConfig.showGrid})}
                />
                <span>Mostrar cuadrícula</span>
              </label>
            </div>

            <div className="zoom-controls">
              <h3>Zoom de la Vista</h3>
              <div className="zoom-buttons">
                <button className="zoom-button" onClick={zoomOut} title="Zoom Out">
                  −
                </button>
                <span className="zoom-level">{Math.round(habitatConfig.zoom * 100)}%</span>
                <button className="zoom-button" onClick={zoomIn} title="Zoom In">
                  +
                </button>
                <button className="zoom-reset" onClick={resetZoom} title="Reset Zoom">
                  ⟲
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="main-area-compact">
          <div className="top-section">
            <div className="info-stats-compact">
              <div className="module-info-compact">
                <h3>Información del Módulo</h3>
                <div className="module-info-content">
                  {selectedModule ? (
                    <>
                      <h4>{selectedModule.name} {selectedModule.icon}</h4>
                      <div className="module-details-grid">
                        <div className="detail-item">
                          <span className="detail-label">Tipo:</span>
                          <span className="detail-value">{selectedModule.type === 'interior' ? 'Interior' : 'Exterior'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Dimensiones:</span>
                          <span className="detail-value">{selectedModule.width} × {selectedModule.height} m</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Peso:</span>
                          <span className="detail-value">{selectedModule.weight} kg</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Costo:</span>
                          <span className="detail-value">${(selectedModule.weight * 10000).toLocaleString()}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Energía:</span>
                          <span className={`detail-value ${selectedModule.energyConsumption > 0 ? 'energy-positive' : 'energy-negative'}`}>
                            {selectedModule.energyConsumption > 0 ? '+' : ''}{selectedModule.energyConsumption} kW
                          </span>
                        </div>
                      </div>
                      <button className="delete-module-button" onClick={deleteSelectedModule}>
                        Eliminar Módulo
                      </button>
                    </>
                  ) : moduleToPlace ? (
                    <>
                      <h4>{moduleToPlace.name} {moduleToPlace.icon}</h4>
                      <div className="module-details-grid">
                        <div className="detail-item">
                          <span className="detail-label">Tipo:</span>
                          <span className="detail-value">{moduleToPlace.type === 'interior' ? 'Interior' : 'Exterior'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Dimensiones:</span>
                          <span className="detail-value">{moduleToPlace.width} × {moduleToPlace.height} m</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Peso:</span>
                          <span className="detail-value">{moduleToPlace.weight} kg</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Costo:</span>
                          <span className="detail-value">${(moduleToPlace.weight * 10000).toLocaleString()}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Energía:</span>
                          <span className={`detail-value ${moduleToPlace.energyConsumption > 0 ? 'energy-positive' : 'energy-negative'}`}>
                            {moduleToPlace.energyConsumption > 0 ? '+' : ''}{moduleToPlace.energyConsumption} kW
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="no-module">Selecciona un módulo para ver su información</p>
                  )}
                </div>
              </div>

              <div className="stats-actions-compact">
                <div className="stats-compact">
                  <h3>Estadísticas</h3>
                  <div className="stats-grid-compact">
                    <div className="stat-item-compact">
                      <span className="stat-label">Costo Total</span>
                      <span className="stat-value">${totalCost.toLocaleString()}</span>
                    </div>
                    <div className="stat-item-compact">
                      <span className="stat-label">Producción Energía</span>
                      <span className="stat-value energy-positive">{energyProduction} kW</span>
                    </div>
                    <div className="stat-item-compact">
                      <span className="stat-label">Consumo Energía</span>
                      <span className="stat-value energy-negative">{energyConsumption} kW</span>
                    </div>
                    <div className="stat-item-compact">
                      <span className="stat-label">Balance Energético</span>
                      <span className={`stat-value ${energyDeficit ? 'energy-warning' : 'energy-ok'}`}>
                        {energyBalance} kW
                      </span>
                    </div>
                    <div className="stat-item-compact">
                      <span className="stat-label">Módulos</span>
                      <span className="stat-value">{modules.length}</span>
                    </div>
                  </div>
                  {energyDeficit && (
                    <div className="energy-alert-compact">
                      ⚠️ Déficit de {Math.abs(energyBalance)} kW
                    </div>
                  )}
                </div>

                <div className="actions-compact">
                  <h3>Acciones</h3>
                  <div className="action-buttons-compact">
                    <button className="action-button secondary" onClick={clearAllModules}>
                      Limpiar Todo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="design-area-compact">
            <div className="design-header-compact">
              <h2>Vista del Hábitat - {habitatConfig.shape === 'cilindrica' ? 'Cilíndrica Horizontal' : 'Domo'}</h2>
              <div className="design-tips">
                <span className="tip">Zoom: {Math.round(habitatConfig.zoom * 100)}% • Grilla: {habitatConfig.showGrid ? 'ON' : 'OFF'}</span>
                <span className="tip">
                  {moduleToPlace ? 'Haz clic para colocar' : selectedModule ? 'Arrastra para mover • Botón Eliminar arriba' : 'Selecciona un módulo'}
                </span>
              </div>
            </div>
            
            <div className="canvas-container-compact">
              <canvas
                ref={canvasRef}
                width={600}
                height={300}
                onClick={handleCanvasClick}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
            </div>
          </div>
        </div>
      </div>

      <footer className="arkadia-footer">
        <p>© 2025 Arkadia Space — Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default HabitatDesigner;