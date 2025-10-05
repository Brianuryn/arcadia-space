import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle, Move, Info } from 'lucide-react';

const HabitatDesigner = () => {
  const [habitatType, setHabitatType] = useState('cilindro-vertical');
  const [crewSize, setCrewSize] = useState(4);
  const [dimensions, setDimensions] = useState({ length: 7.5, diameter: 5 });
  const [placedModules, setPlacedModules] = useState([]);
  const [draggedModule, setDraggedModule] = useState(null);
  const [validationIssues, setValidationIssues] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const canvasRef = useRef(null);

  const SCALE = 50;
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 500;
  const TERRAIN_Y = 420;
  const SECTION_HEIGHT = 2.5;
  const SECTIONS = crewSize <= 3 ? 2 : 3;
  const SECTION_NAMES = crewSize <= 3 
    ? ['Área Habitable', 'Área de Servicio']
    : ['Área Habitable', 'Área Habitable', 'Área de Servicio'];

  const habitatTypes = [
    { id: 'cilindro-vertical', name: 'Cilindro Vertical', locked: false },
    { id: 'cilindro-horizontal', name: 'Cilindro Horizontal', locked: true },
    { id: 'domo', name: 'Domo Inflable', locked: true },
    { id: 'regolito', name: 'Regolito Impreso', locked: true }
  ];

  const availableModules = [
    { id: 'cama', name: 'Cama', width: 1, length: 2, color: '#3B82F6', icon: '🛏️' },
    { id: 'cocina', name: 'Cocina', width: 2, length: 2, color: '#EF4444', icon: '🍳' },
    { id: 'bano', name: 'Baño', width: 1, length: 1, color: '#10B981', icon: '🚿' },
    { id: 'trabajo', name: 'Área de Trabajo', width: 2, length: 2, color: '#F59E0B', icon: '💻' },
    { id: 'almacen', name: 'Almacenamiento', width: 1.5, length: 1, color: '#8B5CF6', icon: '📦' },
    { id: 'laboratorio', name: 'Laboratorio', width: 2.5, length: 2, color: '#EC4899', icon: '🔬' },
    { id: 'pasillo', name: 'Pasillo', width: 0.8, length: 2, color: '#6B7280', icon: '↔️' }
  ];

  useEffect(() => {
    drawHabitat();
  }, [dimensions, placedModules, draggedModule, crewSize, zoomLevel, panX, panY]);

  useEffect(() => {
    validateDesign();
  }, [placedModules, dimensions, crewSize]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    const newLength = crewSize <= 3 ? 5 : 7.5;
    setDimensions(prev => ({ ...prev, length: newLength }));
    setPlacedModules([]);
    setSelectedSection(null);
  }, [crewSize]);

  const checkCollision = (newModule, existingModules) => {
    for (let module of existingModules) {
      if (newModule.x < module.x + module.width && 
          newModule.x + newModule.width > module.x &&
          newModule.y < module.y + module.length && 
          newModule.y + newModule.length > module.y) {
        return true;
      }
    }
    return false;
  };

  const canPlaceModule = (module, section) => {
    const cylHeight = dimensions.length * SCALE;
    const sectionHeight = (cylHeight - 20) / SECTIONS;
    const sectionStartY = (section * sectionHeight) / SCALE;
    const sectionEndY = ((section + 1) * sectionHeight) / SCALE;

    if (module.x < 0 || module.x + module.width > dimensions.diameter) {
      return { canPlace: false, reason: 'El módulo excede el ancho del hábitat' };
    }

    if (module.y < sectionStartY || module.y + module.length > sectionEndY) {
      return { canPlace: false, reason: 'El módulo no cabe en la sección (excede 2.5m de alto)' };
    }

    const modulesInSection = placedModules.filter(m => m.section === section && m.id !== module.id);
    if (checkCollision(module, modulesInSection)) {
      return { canPlace: false, reason: 'El módulo se superpone con otro módulo' };
    }

    return { canPlace: true };
  };

  const drawHabitat = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Guardar el contexto antes de aplicar transformaciones
    ctx.save();
    
    // Aplicar zoom desde el centro del canvas
    const scale = zoomLevel / 100;
    const offsetX = CANVAS_WIDTH / 2;
    const offsetY = CANVAS_HEIGHT / 2;
    
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-offsetX + panX, -offsetY + panY);
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, TERRAIN_Y, CANVAS_WIDTH, CANVAS_HEIGHT - TERRAIN_Y);
    ctx.fillStyle = '#A0522D';
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
      ctx.fillRect(i, TERRAIN_Y, 10, 3);
    }
    
    const cylHeight = dimensions.length * SCALE;
    const cylWidth = dimensions.diameter * SCALE;
    const cylX = (CANVAS_WIDTH - cylWidth) / 2;
    const cylY = TERRAIN_Y - cylHeight - 50;
    
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 4;
    const legWidth = 20;
    const legHeight = 50;
    
    ctx.beginPath();
    ctx.moveTo(cylX + 20, cylY + cylHeight);
    ctx.lineTo(cylX - legWidth, cylY + cylHeight + legHeight);
    ctx.stroke();
    
    ctx.fillStyle = '#555';
    ctx.fillRect(cylX - legWidth - 5, cylY + cylHeight + legHeight, 10, 3);
    
    ctx.beginPath();
    ctx.moveTo(cylX + cylWidth - 20, cylY + cylHeight);
    ctx.lineTo(cylX + cylWidth + legWidth, cylY + cylHeight + legHeight);
    ctx.stroke();
    
    ctx.fillRect(cylX + cylWidth + legWidth - 5, cylY + cylHeight + legHeight, 10, 3);
    
    const thrusterWidth = 20;
    const thrusterHeight = 30;
    const thrusterSpacing = cylWidth / 4;
    
    const thrusterPositions = [
      cylX + thrusterSpacing - thrusterWidth / 2,
      cylX + cylWidth / 2 - thrusterWidth / 2,
      cylX + cylWidth - thrusterSpacing - thrusterWidth / 2
    ];
    
    thrusterPositions.forEach(thrusterX => {
      ctx.fillStyle = '#6B7280';
      ctx.fillRect(thrusterX, cylY + cylHeight, thrusterWidth, thrusterHeight);
      
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.strokeRect(thrusterX, cylY + cylHeight, thrusterWidth, thrusterHeight);
      
      ctx.fillStyle = '#1F2937';
      ctx.beginPath();
      ctx.ellipse(thrusterX + thrusterWidth / 2, cylY + cylHeight + thrusterHeight, 
                  thrusterWidth / 2, 5, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      for (let i = 1; i <= 2; i++) {
        ctx.strokeStyle = '#9CA3AF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(thrusterX, cylY + cylHeight + (thrusterHeight / 3) * i);
        ctx.lineTo(thrusterX + thrusterWidth, cylY + cylHeight + (thrusterHeight / 3) * i);
        ctx.stroke();
      }
    });
    
    ctx.fillStyle = '#E5E7EB';
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    
    ctx.fillRect(cylX, cylY + 20, cylWidth, cylHeight - 20);
    ctx.strokeRect(cylX, cylY + 20, cylWidth, cylHeight - 20);
    
    ctx.beginPath();
    ctx.ellipse(cylX + cylWidth/2, cylY + 20, cylWidth/2, 20, 0, Math.PI, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    const sectionHeight = (cylHeight - 20) / SECTIONS;
    
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 3;
    
    for (let i = 1; i < SECTIONS; i++) {
      const y = cylY + 20 + sectionHeight * i;
      ctx.beginPath();
      ctx.moveTo(cylX, y);
      ctx.lineTo(cylX + cylWidth, y);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    
    for (let i = 0; i < SECTIONS; i++) {
      const y = cylY + 20 + sectionHeight * i + sectionHeight / 2;
      ctx.fillText(`${SECTION_NAMES[i]} (2.5m)`, cylX + 10, y - sectionHeight / 2 + 20);
    }
    
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);
    
    for (let i = 0; i <= dimensions.length; i++) {
      const y = cylY + 20 + i * SCALE;
      if (y < cylY + cylHeight) {
        ctx.beginPath();
        ctx.moveTo(cylX, y);
        ctx.lineTo(cylX + cylWidth, y);
        ctx.stroke();
      }
    }
    
    for (let i = 0; i <= dimensions.diameter; i++) {
      const x = cylX + i * SCALE;
      ctx.beginPath();
      ctx.moveTo(x, cylY + 20);
      ctx.lineTo(x, cylY + cylHeight);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    
    placedModules.forEach(module => {
      drawModule(ctx, module, cylX, cylY + 20, false);
    });
    
    if (draggedModule) {
      drawModule(ctx, draggedModule, cylX, cylY + 20, true);
    }
    
    const solarPanelWidth = 100;
    const solarPanelHeight = 60;
    const solarPanelY = cylY + cylHeight / 2 - solarPanelHeight / 2;
    const armLength = 15;
    
    const leftPanelX = cylX - solarPanelWidth - armLength;
    
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cylX, solarPanelY + solarPanelHeight / 2);
    ctx.lineTo(leftPanelX + solarPanelWidth, solarPanelY + solarPanelHeight / 2);
    ctx.stroke();
    
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(leftPanelX, solarPanelY, solarPanelWidth, solarPanelHeight);
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(leftPanelX, solarPanelY + (solarPanelHeight / 4) * i);
      ctx.lineTo(leftPanelX + solarPanelWidth, solarPanelY + (solarPanelHeight / 4) * i);
      ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(leftPanelX + (solarPanelWidth / 6) * i, solarPanelY);
      ctx.lineTo(leftPanelX + (solarPanelWidth / 6) * i, solarPanelY + solarPanelHeight);
      ctx.stroke();
    }
    
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 3;
    ctx.strokeRect(leftPanelX, solarPanelY, solarPanelWidth, solarPanelHeight);
    
    const rightPanelX = cylX + cylWidth + armLength;
    
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cylX + cylWidth, solarPanelY + solarPanelHeight / 2);
    ctx.lineTo(rightPanelX, solarPanelY + solarPanelHeight / 2);
    ctx.stroke();
    
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(rightPanelX, solarPanelY, solarPanelWidth, solarPanelHeight);
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(rightPanelX, solarPanelY + (solarPanelHeight / 4) * i);
      ctx.lineTo(rightPanelX + solarPanelWidth, solarPanelY + (solarPanelHeight / 4) * i);
      ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(rightPanelX + (solarPanelWidth / 6) * i, solarPanelY);
      ctx.lineTo(rightPanelX + (solarPanelWidth / 6) * i, solarPanelY + solarPanelHeight);
      ctx.stroke();
    }
    
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 3;
    ctx.strokeRect(rightPanelX, solarPanelY, solarPanelWidth, solarPanelHeight);
    
    ctx.fillStyle = '#1F2937';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${dimensions.length}m`, cylX + cylWidth + 10, cylY + cylHeight / 2);
    ctx.fillText(`${dimensions.diameter}m`, cylX + cylWidth / 2 - 15, cylY + cylHeight + 50);
    
    // Restaurar el contexto
    ctx.restore();
  };

  const drawModule = (ctx, module, offsetX, offsetY, isDragging) => {
    const x = offsetX + module.x * SCALE;
    const y = offsetY + module.y * SCALE;
    const w = module.width * SCALE;
    const h = module.length * SCALE;
    
    ctx.fillStyle = isDragging ? module.color + '80' : module.color;
    ctx.fillRect(x, y, w, h);
    
    ctx.strokeStyle = isDragging ? '#000' : '#fff';
    ctx.lineWidth = isDragging ? 3 : 2;
    ctx.strokeRect(x, y, w, h);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(module.icon, x + w/2, y + h/2 - 10);
    
    ctx.font = '10px sans-serif';
    ctx.fillText(module.name, x + w/2, y + h/2 + 10);
  };

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = zoomLevel / 100;
    
    // Ajustar coordenadas del mouse según el zoom y pan
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    const offsetX = CANVAS_WIDTH / 2;
    const offsetY = CANVAS_HEIGHT / 2;
    
    const mouseX = (rawX - offsetX) / scale + offsetX - panX;
    const mouseY = (rawY - offsetY) / scale + offsetY - panY;
    
    const cylWidth = dimensions.diameter * SCALE;
    const cylHeight = dimensions.length * SCALE;
    const cylX = (CANVAS_WIDTH - cylWidth) / 2;
    const cylY = TERRAIN_Y - cylHeight - 50;
    
    const clickedModule = placedModules.find(module => {
      const x = cylX + module.x * SCALE;
      const y = cylY + 20 + module.y * SCALE;
      const w = module.width * SCALE;
      const h = module.length * SCALE;
      return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
    });
    
    if (clickedModule) {
      setDraggedModule({...clickedModule, offsetX: mouseX - (cylX + clickedModule.x * SCALE), offsetY: mouseY - (cylY + 20 + clickedModule.y * SCALE)});
      setPlacedModules(placedModules.filter(m => m !== clickedModule));
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggedModule) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = zoomLevel / 100;
    
    // Ajustar coordenadas del mouse según el zoom y pan
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    const offsetX = CANVAS_WIDTH / 2;
    const offsetY = CANVAS_HEIGHT / 2;
    
    const mouseX = (rawX - offsetX) / scale + offsetX - panX;
    const mouseY = (rawY - offsetY) / scale + offsetY - panY;
    
    const cylWidth = dimensions.diameter * SCALE;
    const cylHeight = dimensions.length * SCALE;
    const cylX = (CANVAS_WIDTH - cylWidth) / 2;
    const cylY = TERRAIN_Y - cylHeight - 50;
    
    const newX = (mouseX - cylX - draggedModule.offsetX) / SCALE;
    const newY = (mouseY - cylY - 20 - draggedModule.offsetY) / SCALE;
    
    setDraggedModule({...draggedModule, x: newX, y: newY});
  };

  const handleCanvasMouseUp = () => {
    if (!draggedModule) return;
    
    const cylHeight = dimensions.length * SCALE;
    const sectionHeight = (cylHeight - 20) / SECTIONS;
    
    let moduleSection = Math.floor((draggedModule.y * SCALE) / sectionHeight);
    moduleSection = Math.max(0, Math.min(moduleSection, SECTIONS - 1));
    
    const sectionStartY = (moduleSection * sectionHeight) / SCALE;
    const sectionEndY = ((moduleSection + 1) * sectionHeight) / SCALE;
    
    let finalX = Math.max(0, Math.min(draggedModule.x, dimensions.diameter - draggedModule.width));
    let finalY = Math.max(sectionStartY, Math.min(draggedModule.y, sectionEndY - draggedModule.length));
    
    if (finalY + draggedModule.length > sectionEndY) {
      finalY = sectionEndY - draggedModule.length;
    }

    const moduleToPlace = {...draggedModule, x: finalX, y: finalY, section: moduleSection};
    const validationResult = canPlaceModule(moduleToPlace, moduleSection);

    if (validationResult.canPlace) {
      setPlacedModules([...placedModules, moduleToPlace]);
      setDraggedModule(null);
    } else {
      setErrorMessage(`❌ No hay espacio en ${SECTION_NAMES[moduleSection]}: ${validationResult.reason}`);
      setDraggedModule(null);
    }
  };

  const addModule = (moduleType) => {
    const targetSection = selectedSection !== null ? selectedSection : 0;
    const cylHeight = dimensions.length * SCALE;
    const sectionHeight = (cylHeight - 20) / SECTIONS;
    const sectionStartY = (targetSection * sectionHeight) / SCALE;
    
    const newModule = {
      ...moduleType,
      id: `${moduleType.id}-${Date.now()}`,
      x: 0,
      y: sectionStartY,
      section: targetSection
    };

    const validationResult = canPlaceModule(newModule, targetSection);
    
    if (validationResult.canPlace) {
      setPlacedModules([...placedModules, newModule]);
    } else {
      setErrorMessage(`❌ No hay espacio en ${SECTION_NAMES[targetSection]}: ${validationResult.reason}`);
    }
  };

  const removeModule = (moduleId) => {
    setPlacedModules(placedModules.filter(m => m.id !== moduleId));
  };

  const handlePan = (direction) => {
    const panStep = 20;
    switch(direction) {
      case 'up':
        setPanY(panY + panStep);
        break;
      case 'down':
        setPanY(panY - panStep);
        break;
      case 'left':
        setPanX(panX + panStep);
        break;
      case 'right':
        setPanX(panX - panStep);
        break;
      case 'reset':
        setPanX(0);
        setPanY(0);
        break;
    }
  };

  const validateDesign = () => {
    const issues = [];
    
    const sectionArea = dimensions.diameter * SECTION_HEIGHT;
    
    for (let s = 0; s < SECTIONS; s++) {
      const modulesInSection = placedModules.filter(m => m.section === s);
      const usedArea = modulesInSection.reduce((sum, m) => sum + (m.width * m.length), 0);
      const utilizationPercent = (usedArea / sectionArea * 100).toFixed(1);
      
      if (utilizationPercent > 90) {
        issues.push({ type: 'warning', msg: `${SECTION_NAMES[s]}: ${utilizationPercent}% - Muy saturada` });
      } else if (utilizationPercent > 0) {
        issues.push({ type: 'info', msg: `${SECTION_NAMES[s]}: ${utilizationPercent}% de espacio usado (${usedArea.toFixed(1)}m² / ${sectionArea.toFixed(1)}m²)` });
      }
    }
    
    const totalArea = dimensions.diameter * dimensions.length;
    const usedArea = placedModules.reduce((sum, m) => sum + (m.width * m.length), 0);
    const utilizationPercent = (usedArea / totalArea * 100).toFixed(1);
    
    issues.push({ type: 'success', msg: `Uso total del hábitat: ${utilizationPercent}%` });
    
    const pasillos = placedModules.filter(m => m.id.startsWith('pasillo'));
    pasillos.forEach(pasillo => {
      if (pasillo.width < 0.6) {
        issues.push({ type: 'error', msg: `Pasillo en ${SECTION_NAMES[pasillo.section]} muy estrecho (${pasillo.width}m) - Mínimo 0.6m` });
      }
    });
    
    const hasCocina = placedModules.some(m => m.id.startsWith('cocina'));
    const hasBano = placedModules.some(m => m.id.startsWith('bano'));
    const hasCama = placedModules.some(m => m.id.startsWith('cama'));
    
    if (!hasCocina) issues.push({ type: 'warning', msg: 'Falta módulo de cocina' });
    if (!hasBano) issues.push({ type: 'warning', msg: 'Falta módulo de baño' });
    if (!hasCama) issues.push({ type: 'warning', msg: 'Falta módulo de dormitorio' });
    
    setValidationIssues(issues);
  };

  const getIssueIcon = (type) => {
    switch(type) {
      case 'error': return <AlertCircle className="text-red-500" size={16} />;
      case 'warning': return <AlertCircle className="text-yellow-500" size={16} />;
      case 'success': return <CheckCircle className="text-green-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            NASA Habitat Designer
          </h1>
          <p className="text-slate-300">Space Apps Challenge - Diseñador de Hábitats Espaciales</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              ⚙️ Configuración
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cantidad de Tripulantes</label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {[2, 3, 4, 5, 6].map(size => (
                    <button
                      key={size}
                      onClick={() => setCrewSize(size)}
                      className={`p-3 rounded font-bold transition ${
                        crewSize === size
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-slate-400 bg-slate-700 p-2 rounded">
                  {crewSize <= 3 
                    ? '2-3 tripulantes: 1 área habitable + 1 área de servicio (5m)'
                    : '4-6 tripulantes: 2 áreas habitables + 1 área de servicio (7.5m)'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Forma del Módulo Espacial</label>
                <select
                  value={habitatType}
                  onChange={(e) => {
                    const selected = habitatTypes.find(t => t.id === e.target.value);
                    if (!selected.locked) {
                      setHabitatType(e.target.value);
                    }
                  }}
                  className="w-full p-3 bg-slate-700 text-white rounded cursor-pointer hover:bg-slate-600 transition"
                >
                  {habitatTypes.map(type => (
                    <option 
                      key={type.id} 
                      value={type.id}
                      disabled={type.locked}
                    >
                      {type.name} {type.locked ? '🔒' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Largo Total (automático)</label>
                <div className="bg-slate-700 p-4 rounded text-center">
                  <div className="text-3xl font-bold text-blue-400">{dimensions.length}m</div>
                  <div className="text-xs text-slate-400 mt-1">{SECTIONS} secciones × 2.5m cada una</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Diámetro (metros)</label>
                <input
                  type="range"
                  min="5"
                  max="7"
                  step="0.5"
                  value={dimensions.diameter}
                  onChange={(e) => setDimensions({...dimensions, diameter: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="text-center text-2xl font-bold text-blue-400">{dimensions.diameter}m</div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="text-sm text-slate-400">
                  <div className="flex justify-between mb-1">
                    <span>Configuración:</span>
                    <span className="font-bold">{SECTIONS} secciones × 2.5m</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Volumen total:</span>
                    <span className="font-bold">{(Math.PI * Math.pow(dimensions.diameter/2, 2) * dimensions.length).toFixed(2)}m³</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Área por sección:</span>
                    <span className="font-bold">{(dimensions.diameter * SECTION_HEIGHT).toFixed(2)}m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Área total planta:</span>
                    <span className="font-bold">{(dimensions.diameter * dimensions.length).toFixed(2)}m²</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {errorMessage && (
              <div className="bg-red-500 text-white p-4 rounded-lg shadow-xl flex items-center gap-3 animate-pulse">
                <AlertCircle size={24} />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4">📦 Módulos Disponibles</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Agregar módulos a:</label>
                <div className="flex gap-2">
                  {Array.from({ length: SECTIONS }, (_, i) => i).map(section => (
                    <button
                      key={section}
                      onClick={() => setSelectedSection(section)}
                      className={`flex-1 p-3 rounded transition ${
                        selectedSection === section
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {SECTION_NAMES[section]}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {availableModules.map(module => (
                  <button
                    key={module.id}
                    onClick={() => addModule(module)}
                    className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition transform hover:scale-105 flex flex-col items-center gap-2"
                  >
                    <div className="text-3xl">{module.icon}</div>
                    <div className="text-xs font-medium text-center">{module.name}</div>
                    <div className="text-xs text-slate-400">{module.width}×{module.length}m</div>
                  </button>
                ))}
              </div>

              {placedModules.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <h3 className="font-bold mb-3">Módulos Colocados ({placedModules.length})</h3>
                  {Array.from({ length: SECTIONS }, (_, i) => i).map(section => {
                    const modulesInSection = placedModules.filter(m => m.section === section);
                    if (modulesInSection.length === 0) return null;
                    
                    return (
                      <div key={section} className="mb-4">
                        <h4 className="text-sm font-semibold text-blue-400 mb-2">{SECTION_NAMES[section]} ({modulesInSection.length})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {modulesInSection.map(module => (
                            <div key={module.id} className="flex items-center justify-between p-2 bg-slate-700 rounded text-sm">
                              <span>{module.icon} {module.name}</span>
                              <button
                                onClick={() => removeModule(module.id)}
                                className="text-red-400 hover:text-red-300 ml-2"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    🏗️ Vista de Perfil 2D
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setZoomLevel(Math.max(10, zoomLevel - 10))}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition"
                      disabled={zoomLevel <= 10}
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold min-w-[60px] text-center">
                      {zoomLevel}%
                    </span>
                    <button
                      onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition"
                      disabled={zoomLevel >= 200}
                    >
                      +
                    </button>
                    <button
                      onClick={() => setZoomLevel(100)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded transition text-sm"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="bg-slate-900 rounded-lg p-4 flex justify-center relative">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className="border border-slate-700 cursor-move rounded"
                />
                
                {/* Control de navegación flotante */}
                <div className="absolute bottom-4 left-4 bg-slate-800 bg-opacity-70 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                  <div className="grid grid-cols-3 gap-1" style={{ width: '80px' }}>
                    <div></div>
                    <button
                      onClick={() => handlePan('up')}
                      className="p-1 bg-slate-700 bg-opacity-80 hover:bg-slate-600 rounded transition flex items-center justify-center text-xs"
                    >
                      ▲
                    </button>
                    <div></div>
                    <button
                      onClick={() => handlePan('left')}
                      className="p-1 bg-slate-700 bg-opacity-80 hover:bg-slate-600 rounded transition flex items-center justify-center text-xs"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => handlePan('reset')}
                      className="p-1 bg-blue-600 bg-opacity-80 hover:bg-blue-500 rounded transition text-xs"
                      title="Centrar vista"
                    >
                      ⊙
                    </button>
                    <button
                      onClick={() => handlePan('right')}
                      className="p-1 bg-slate-700 bg-opacity-80 hover:bg-slate-600 rounded transition flex items-center justify-center text-xs"
                    >
                      ▶
                    </button>
                    <div></div>
                    <button
                      onClick={() => handlePan('down')}
                      className="p-1 bg-slate-700 bg-opacity-80 hover:bg-slate-600 rounded transition flex items-center justify-center text-xs"
                    >
                      ▼
                    </button>
                    <div></div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-2 text-center">
                <Move size={14} className="inline mr-1" />
                Arrastra los módulos | Usa +/− para zoom | Flechas para navegar
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4">📊 Validación del Diseño</h2>
              <div className="space-y-2">
                {validationIssues.length === 0 ? (
                  <p className="text-slate-400">Agrega módulos para comenzar...</p>
                ) : (
                  validationIssues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-slate-700 rounded">
                      {getIssueIcon(issue.type)}
                      <span className="text-sm">{issue.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitatDesigner;