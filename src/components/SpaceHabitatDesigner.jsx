import React, { useState, useRef, useEffect } from 'react';
import '../styles/SpaceHabitatDesigner.css';
import { Home, Bed, UtensilsCrossed, Droplet, Briefcase, Package, AlertCircle, CheckCircle, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

const SpaceHabitatDesigner = () => {
  const [habitatShape, setHabitatShape] = useState('cylinder_vertical');
  const [dimensions, setDimensions] = useState({ length: 6, diameter: 4, height: 4 });
  const [modules, setModules] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [zoomTop, setZoomTop] = useState(1);
  const [zoomProfile, setZoomProfile] = useState(1);
  const [numPeople, setNumPeople] = useState(4);
  const [numFloors, setNumFloors] = useState(1);
  const [panTop, setPanTop] = useState({ x: 0, y: 0 });
  const [panProfile, setPanProfile] = useState({ x: 0, y: 0 });
  const [isPanningTop, setIsPanningTop] = useState(false);
  const [isPanningProfile, setIsPanningProfile] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const canvasTopRef = useRef(null);
  const canvasProfileRef = useRef(null);

  const moduleTypes = [
    { id: 'dormitory', name: 'Dormitorio', icon: Bed, size: 2, width: 1.5, color: '#60a5fa' },
    { id: 'kitchen', name: 'Cocina/Comedor', icon: UtensilsCrossed, size: 2.5, width: 2, color: '#f59e0b' },
    { id: 'operations', name: 'Sala de Operaciones', icon: Briefcase, size: 3, width: 2.5, color: '#10b981' },
    { id: 'laboratory', name: 'Laboratorio', icon: Briefcase, size: 2.5, width: 2, color: '#8b5cf6' },
    { id: 'services', name: 'Servicios/Depósito', icon: Package, size: 2, width: 1.5, color: '#6b7280' },
    { id: 'quarantine', name: 'Área de Cuarentena', icon: Droplet, size: 2, width: 1.5, color: '#ef4444' }
  ];

  const getUsableArea = () => {
    if (habitatShape === 'cylinder_vertical' || habitatShape === 'cylinder_horizontal') {
      return Math.PI * Math.pow(dimensions.diameter / 2, 2);
    } else if (habitatShape === 'sphere') {
      return 4 * Math.PI * Math.pow(dimensions.diameter / 2, 2);
    } else if (habitatShape === 'dome') {
      return Math.PI * Math.pow(dimensions.diameter / 2, 2);
    }
    return dimensions.length * dimensions.diameter;
  };

  const getUsableVolume = () => {
    if (habitatShape === 'cylinder_vertical' || habitatShape === 'cylinder_horizontal') {
      return Math.PI * Math.pow(dimensions.diameter / 2, 2) * dimensions.length;
    } else if (habitatShape === 'sphere') {
      return (4/3) * Math.PI * Math.pow(dimensions.diameter / 2, 3);
    } else if (habitatShape === 'dome') {
      return (2/3) * Math.PI * Math.pow(dimensions.diameter / 2, 3);
    }
    return dimensions.length * dimensions.diameter * dimensions.height;
  };

  const calculateProblems = () => {
    const problems = [];
    const usedArea = modules.reduce((acc, m) => {
      const type = moduleTypes.find(t => t.id === m.type);
      return acc + (type.size * type.width);
    }, 0);
    
    const totalArea = getUsableArea();
    
    if (usedArea > totalArea * 0.85) {
      problems.push('⚠️ Área utilizada > 85% - espacio limitado');
    }

    modules.forEach((m, i) => {
      modules.forEach((m2, j) => {
        if (i < j) {
          const dist = Math.sqrt(Math.pow(m.x - m2.x, 2) + Math.pow(m.y - m2.y, 2));
          const type1 = moduleTypes.find(t => t.id === m.type);
          const type2 = moduleTypes.find(t => t.id === m2.type);
          const minDist = (type1.width + type2.width) / 2 + 0.6;
          
          if (dist < minDist && dist > 0.1) {
            problems.push('⚠️ Pasillo < 0.6m entre módulos - no cumple');
          }
        }
      });
    });

    const hasQuarantine = modules.some(m => m.type === 'quarantine');
    const hasDormitory = modules.some(m => m.type === 'dormitory');
    const hasKitchen = modules.some(m => m.type === 'kitchen');
    
    if (!hasQuarantine) {
      problems.push('💡 Sugerencia: Incluir área de cuarentena (protocolo espacial)');
    }
    
    if (!hasDormitory) {
      problems.push('⚠️ Falta módulo crítico: Dormitorio');
    }
    
    if (!hasKitchen) {
      problems.push('⚠️ Falta módulo crítico: Cocina/Comedor');
    }

    const hasServices = modules.some(m => m.type === 'services');
    const servicesNearEntrance = modules.some(m => 
      m.type === 'services' && m.y < dimensions.length * 0.3
    );
    
    if (hasServices && !servicesNearEntrance) {
      problems.push('💡 Sugerencia: Colocar servicios/depósito cerca de la entrada');
    }

    return problems;
  };

  const addModule = (type) => {
    const newModule = {
      id: Date.now(),
      type: type.id,
      x: dimensions.diameter / 2,
      y: dimensions.length / 2,
      rotation: 0
    };
    setModules([...modules, newModule]);
  };

  const handleDragStart = (e, module) => {
    setDragging(module);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    if (!dragging) return;
    
    const canvas = canvasTopRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = 60 * zoomTop;
    
    let canvasWidth, canvasHeight;
    if (habitatShape === 'cylinder_horizontal') {
      canvasWidth = dimensions.length * scale;
      canvasHeight = dimensions.diameter * scale;
    } else if (habitatShape === 'dome' || habitatShape === 'sphere') {
      canvasWidth = dimensions.diameter * scale;
      canvasHeight = dimensions.diameter * scale;
    } else {
      canvasWidth = dimensions.diameter * scale;
      canvasHeight = dimensions.diameter * scale;
    }
    
    const offsetX = (800 - canvasWnpmidth) / 2;
    const offsetY = (600 - canvasHeight) / 2;
    
    let x, y;
    if (habitatShape === 'cylinder_horizontal') {
      y = ((e.clientX - rect.left - offsetX) / canvasWidth) * dimensions.length;
      x = ((e.clientY - rect.top - offsetY) / canvasHeight) * dimensions.diameter;
    } else if (habitatShape === 'cylinder_vertical') {
      x = ((e.clientX - rect.left - offsetX) / canvasWidth) * dimensions.diameter;
      y = ((e.clientY - rect.top - offsetY) / canvasHeight) * dimensions.diameter;
    } else {
      x = ((e.clientX - rect.left - offsetX) / canvasWidth) * dimensions.diameter;
      y = ((e.clientY - rect.top - offsetY) / canvasHeight) * dimensions.diameter;
    }
    
    setModules(modules.map(m => 
      m.id === dragging.id ? { ...m, x, y } : m
    ));
    setDragging(null);
  };

  const optimizeLayout = () => {
    const sorted = [...modules].sort((a, b) => {
      const priorities = { 
        services: 0, 
        quarantine: 1, 
        operations: 2, 
        laboratory: 3, 
        kitchen: 4, 
        dormitory: 5 
      };
      return (priorities[a.type] || 6) - (priorities[b.type] || 6);
    });

    let currentY = 0.5;
    const optimized = sorted.map((m, i) => {
      const type = moduleTypes.find(t => t.id === m.type);
      const x = dimensions.diameter / 2;
      const y = currentY + type.size / 2;
      currentY += type.size + 0.6;
      
      return { ...m, x, y };
    });

    setModules(optimized);
  };

  // Panning handlers for Top view
  const handleMouseDownTop = (e) => {
    setIsPanningTop(true);
    setLastPanPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMoveTop = (e) => {
    if (!isPanningTop) return;
    
    const deltaX = e.clientX - lastPanPos.x;
    const deltaY = e.clientY - lastPanPos.y;
    
    setPanTop(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastPanPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUpTop = () => {
    setIsPanningTop(false);
  };

  // Panning handlers for Profile view
  const handleMouseDownProfile = (e) => {
    setIsPanningProfile(true);
    setLastPanPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMoveProfile = (e) => {
    if (!isPanningProfile) return;
    
    const deltaX = e.clientX - lastPanPos.x;
    const deltaY = e.clientY - lastPanPos.y;
    
    setPanProfile(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastPanPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUpProfile = () => {
    setIsPanningProfile(false);
  };

  // Draw 2D Top view
  useEffect(() => {
    const canvas = canvasTopRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const scale = 60 * zoomTop;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply panning once for everything
    ctx.save();
    ctx.translate(panTop.x, panTop.y);
    
    // Draw grid that moves with panning
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    const gridSize = 30;
    
    const startX = Math.floor(-panTop.x / gridSize) * gridSize;
    const startY = Math.floor(-panTop.y / gridSize) * gridSize;
    
    for (let x = startX; x < canvas.width - panTop.x; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, canvas.height - panTop.y);
      ctx.stroke();
    }
    
    for (let y = startY; y < canvas.height - panTop.y; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(canvas.width - panTop.x, y);
      ctx.stroke();
    }
    
    let canvasWidth, canvasHeight;
    if (habitatShape === 'cylinder_horizontal') {
      canvasWidth = dimensions.length * scale;
      canvasHeight = dimensions.diameter * scale;
    } else if (habitatShape === 'dome' || habitatShape === 'sphere') {
      canvasWidth = dimensions.diameter * scale;
      canvasHeight = dimensions.diameter * scale;
    } else {
      canvasWidth = dimensions.diameter * scale;
      canvasHeight = dimensions.diameter * scale;
    }
    
    const offsetX = (canvas.width - canvasWidth) / 2;
    const offsetY = (canvas.height - canvasHeight) / 2;
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;
    
    if (habitatShape === 'cylinder_vertical') {
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, canvasHeight / 2, (dimensions.diameter * scale) / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (habitatShape === 'cylinder_horizontal') {
      ctx.strokeRect(0, 0, dimensions.length * scale, dimensions.diameter * scale);
    } else if (habitatShape === 'sphere') {
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, canvasHeight / 2, (dimensions.diameter * scale) / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (habitatShape === 'dome') {
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, canvasHeight / 2, (dimensions.diameter * scale) / 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    modules.forEach(m => {
      const type = moduleTypes.find(t => t.id === m.type);
      ctx.fillStyle = type.color;
      ctx.strokeStyle = dragging?.id === m.id ? '#fff' : '#1f2937';
      ctx.lineWidth = 2;
      
      let x, y, w, h;
      if (habitatShape === 'cylinder_horizontal') {
        x = m.y * scale - (type.size * scale) / 2;
        y = m.x * scale - (type.width * scale) / 2;
        w = type.size * scale;
        h = type.width * scale;
      } else {
        x = m.x * scale - (type.width * scale) / 2;
        y = m.y * scale - (type.size * scale) / 2;
        w = type.width * scale;
        h = type.size * scale;
      }
      
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      
      ctx.fillStyle = '#fff';
      ctx.font = `${12}px sans-serif`;
      ctx.textAlign = 'center';
      
      const textX = habitatShape === 'cylinder_horizontal' ? m.y * scale : m.x * scale;
      const textY = habitatShape === 'cylinder_horizontal' ? m.x * scale + 5 : m.y * scale + 5;
      ctx.fillText(type.name, textX, textY);
    });
    
    ctx.restore();
    ctx.restore();
  }, [modules, dimensions, habitatShape, dragging, zoomTop, panTop]);

  // Draw 2D Profile view
  useEffect(() => {
    const canvas = canvasProfileRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const scale = 60 * zoomProfile;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply panning
    ctx.save();
    ctx.translate(panProfile.x, panProfile.y);
    
    // Draw fixed grid
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    const gridSize = 30;
    
    for (let x = -panProfile.x; x <= canvas.width - panProfile.x; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -panProfile.y);
      ctx.lineTo(x, canvas.height - panProfile.y);
      ctx.stroke();
    }
    
    for (let y = -panProfile.y; y <= canvas.height - panProfile.y; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-panProfile.x, y);
      ctx.lineTo(canvas.width - panProfile.x, y);
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Draw terrain line
    const terrainY = canvas.height * 0.75;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, terrainY);
    ctx.lineTo(canvas.width, terrainY);
    ctx.stroke();
    
    // Re-apply panning for habitat
    ctx.save();
    ctx.translate(panProfile.x, panProfile.y);
    
    const legHeight = 0.8 * scale;
    let habitatWidth, habitatHeight;
    
    if (habitatShape === 'cylinder_vertical') {
      const radius = (dimensions.diameter * scale) / 2;
      const bodyHeight = dimensions.length * scale;
      habitatWidth = dimensions.diameter * scale;
      habitatHeight = radius * 2 + bodyHeight;
    } else if (habitatShape === 'cylinder_horizontal') {
      habitatWidth = dimensions.length * scale;
      habitatHeight = dimensions.diameter * scale;
    } else if (habitatShape === 'sphere') {
      habitatWidth = dimensions.diameter * scale;
      habitatHeight = dimensions.diameter * scale;
    } else if (habitatShape === 'dome') {
      habitatWidth = dimensions.diameter * scale;
      habitatHeight = (dimensions.diameter / 2) * scale;
    }
    
    const offsetX = (canvas.width - habitatWidth) / 2;
    const offsetY = terrainY - habitatHeight - legHeight;
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;
    
    if (habitatShape === 'cylinder_vertical') {
      const radius = (dimensions.diameter * scale) / 2;
      const bodyHeight = dimensions.length * scale;
      const centerX = habitatWidth / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, radius, radius, Math.PI, 0, false);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, radius);
      ctx.lineTo(0, radius + bodyHeight);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(habitatWidth, radius);
      ctx.lineTo(habitatWidth, radius + bodyHeight);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(centerX, radius + bodyHeight, radius, 0, Math.PI, false);
      ctx.stroke();
      
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, radius + bodyHeight);
      ctx.lineTo(habitatWidth, radius + bodyHeight);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 4;
      const legOffset = habitatWidth * 0.25;
      const bottomY = radius * 2 + bodyHeight;
      
      ctx.beginPath();
      ctx.moveTo(legOffset, bottomY);
      ctx.lineTo(legOffset - 15, bottomY + legHeight);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(habitatWidth - legOffset, bottomY);
      ctx.lineTo(habitatWidth - legOffset + 15, bottomY + legHeight);
      ctx.stroke();
      
      modules.forEach(m => {
        const type = moduleTypes.find(t => t.id === m.type);
        ctx.fillStyle = type.color + '80';
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;
        
        const x = m.x * scale - (type.width * scale) / 2;
        const y = radius + m.y * scale - 10;
        const w = type.width * scale;
        const h = 20;
        
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      });
      
    } else if (habitatShape === 'cylinder_horizontal') {
      const radius = (dimensions.diameter * scale) / 2;
      const bodyWidth = dimensions.length * scale;
      
      ctx.beginPath();
      ctx.arc(radius, radius, radius, Math.PI / 2, Math.PI * 3 / 2, false);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(radius + bodyWidth, 0);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(radius, dimensions.diameter * scale);
      ctx.lineTo(radius + bodyWidth, dimensions.diameter * scale);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(radius + bodyWidth, radius, radius, Math.PI * 3 / 2, Math.PI / 2, false);
      ctx.stroke();
      
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 3;
      const legOffset2 = bodyWidth * 0.2;
      
      ctx.beginPath();
      ctx.moveTo(radius + legOffset2, dimensions.diameter * scale);
      ctx.lineTo(radius + legOffset2 - 15, dimensions.diameter * scale + legHeight);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(radius + bodyWidth - legOffset2, dimensions.diameter * scale);
      ctx.lineTo(radius + bodyWidth - legOffset2 + 15, dimensions.diameter * scale + legHeight);
      ctx.stroke();
      
      modules.forEach(m => {
        const type = moduleTypes.find(t => t.id === m.type);
        ctx.fillStyle = type.color + '80';
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;
        
        const x = radius + m.y * scale - (type.size * scale) / 2;
        const y = m.x * scale - 10;
        const w = type.size * scale;
        const h = 20;
        
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      });
      
    } else if (habitatShape === 'sphere') {
      const radius = (dimensions.diameter * scale) / 2;
      
      ctx.beginPath();
      ctx.arc(habitatWidth / 2, radius, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 3;
      const legOffset3 = habitatWidth * 0.3;
      
      ctx.beginPath();
      ctx.moveTo(habitatWidth / 2 - legOffset3, dimensions.diameter * scale);
      ctx.lineTo(habitatWidth / 2 - legOffset3 - 15, dimensions.diameter * scale + legHeight);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(habitatWidth / 2 + legOffset3, dimensions.diameter * scale);
      ctx.lineTo(habitatWidth / 2 + legOffset3 + 15, dimensions.diameter * scale + legHeight);
      ctx.stroke();
      
      modules.forEach(m => {
        const type = moduleTypes.find(t => t.id === m.type);
        ctx.fillStyle = type.color + '80';
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;
        
        const x = m.x * scale - (type.width * scale) / 2;
        const y = radius - 10;
        const w = type.width * scale;
        const h = 20;
        
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      });
      
    } else if (habitatShape === 'dome') {
      const centerX = habitatWidth / 2;
      const radius = (dimensions.diameter * scale) / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, habitatHeight, radius, Math.PI, 0, false);
      ctx.lineTo(dimensions.diameter * scale, habitatHeight);
      ctx.lineTo(0, habitatHeight);
      ctx.closePath();
      ctx.stroke();
      
      modules.forEach(m => {
        const type = moduleTypes.find(t => t.id === m.type);
        ctx.fillStyle = type.color + '80';
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;
        
        const x = m.x * scale - (type.width * scale) / 2;
        const y = habitatHeight - 30;
        const w = type.width * scale;
        const h = 20;
        
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      });
    }
    
    ctx.restore();
    ctx.restore();
    
  }, [modules, dimensions, habitatShape, zoomProfile, panProfile]);

  const problems = calculateProblems();
  const usedVolume = modules.reduce((acc, m) => {
    const type = moduleTypes.find(t => t.id === m.type);
    return acc + (type.size * type.width * 2.5);
  }, 0);

  return (
    <div className="w-full h-screen bg-gray-900 text-white p-6 overflow-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Home className="w-8 h-8" />
        Diseñador de Hábitats Espaciales
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <h2 className="text-xl font-semibold mb-4">1. Configuración del Hábitat</h2>
          
          <div>
            <label className="block mb-2">Forma del Hábitat</label>
            <select 
              value={habitatShape}
              onChange={(e) => setHabitatShape(e.target.value)}
              className="w-full bg-gray-700 rounded px-3 py-2"
            >
              <option value="cylinder_vertical">Cilindro Vertical</option>
              <option value="cylinder_horizontal">Cilindro Horizontal</option>
              <option value="dome">Domo</option>
              <option value="sphere">Esfera</option>
            </select>
          </div>
          
          {(habitatShape === 'cylinder_vertical' || habitatShape === 'cylinder_horizontal') && (
            <>
              <div>
                <label className="block mb-2">Largo (m): {dimensions.length}</label>
                <input 
                  type="range" 
                  min="3" 
                  max="15" 
                  value={dimensions.length}
                  onChange={(e) => setDimensions({...dimensions, length: parseFloat(e.target.value)})}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block mb-2">Diámetro (m): {dimensions.diameter}</label>
                <input 
                  type="range" 
                  min="2" 
                  max="8" 
                  value={dimensions.diameter}
                  onChange={(e) => setDimensions({...dimensions, diameter: parseFloat(e.target.value)})}
                  className="w-full"
                />
              </div>
            </>
          )}
          
          {(habitatShape === 'sphere' || habitatShape === 'dome') && (
            <div>
              <label className="block mb-2">Diámetro (m): {dimensions.diameter}</label>
              <input 
                type="range" 
                min="3" 
                max="10" 
                value={dimensions.diameter}
                onChange={(e) => setDimensions({...dimensions, diameter: parseFloat(e.target.value)})}
                className="w-full"
              />
            </div>
          )}
          
          <div className="bg-gray-700 rounded p-3">
            <p className="text-sm">Área útil: <span className="font-bold">{getUsableArea().toFixed(2)} m²</span></p>
            <p className="text-sm">Volumen útil: <span className="font-bold">{getUsableVolume().toFixed(2)} m³</span></p>
            <p className="text-sm">Volumen usado: <span className="font-bold">{usedVolume.toFixed(2)} m³</span></p>
          </div>
          
          <div className="border-t border-gray-600 pt-4">
            <h2 className="text-xl font-semibold mb-3">2. Capacidad y Distribución</h2>
            
            <div>
              <label className="block mb-2">Cantidad de Personas: {numPeople}</label>
              <input 
                type="range" 
                min="1" 
                max="6" 
                value={numPeople}
                onChange={(e) => setNumPeople(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block mb-2">Cantidad de Pisos/Áreas: {numFloors}</label>
              <input 
                type="range" 
                min="1" 
                max="3" 
                value={numFloors}
                onChange={(e) => setNumFloors(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 piso</span>
                <span>2 pisos</span>
                <span>3 pisos</span>
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">3. Módulos del Hábitat</h2>
          
          <div className="space-y-2">
            {moduleTypes.map(type => (
              <button
                key={type.id}
                onClick={() => addModule(type)}
                className="w-full bg-gray-700 hover:bg-gray-600 rounded p-3 flex items-center gap-3 transition text-left"
              >
                <type.icon className="w-5 h-5 flex-shrink-0" style={{ color: type.color }} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{type.name}</div>
                  <div className="text-xs text-gray-400">{type.size}m × {type.width}m</div>
                </div>
                <span className="text-2xl text-gray-400">+</span>
              </button>
            ))}
          </div>
          
          <button
            onClick={optimizeLayout}
            className="w-full bg-blue-600 hover:bg-blue-700 rounded px-4 py-2 flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Optimizar Distribución
          </button>
          
          <button
            onClick={() => setModules([])}
            className="w-full bg-red-600 hover:bg-red-700 rounded px-4 py-2 transition"
          >
            Limpiar Todo
          </button>
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Vista 2D desde Arriba</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomTop(Math.max(0.5, zoomTop - 0.1))}
                  className="bg-gray-700 hover:bg-gray-600 rounded px-3 py-2 flex items-center gap-1"
                  title="Alejar"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400 min-w-16 text-center">
                  {Math.round(zoomTop * 100)}%
                </span>
                <button
                  onClick={() => setZoomTop(Math.min(2, zoomTop + 0.1))}
                  className="bg-gray-700 hover:bg-gray-600 rounded px-3 py-2 flex items-center gap-1"
                  title="Acercar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div 
              className="bg-gray-900 rounded overflow-hidden"
              style={{ height: '600px' }}
            >
              <canvas 
                ref={canvasTopRef} 
                width={800} 
                height={600}
                className="w-full h-full"
                style={{ cursor: isPanningTop ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDownTop}
                onMouseMove={handleMouseMoveTop}
                onMouseUp={handleMouseUpTop}
                onMouseLeave={handleMouseUpTop}
              />
            </div>
            
            <p className="text-sm text-gray-400 mt-2">
              💡 Haz clic y arrastra para moverte por el lienzo | Cuadrícula: 0.5m
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Vista 2D de Perfil</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomProfile(Math.max(0.25, zoomProfile - 0.1))}
                  className="bg-gray-700 hover:bg-gray-600 rounded px-3 py-2 flex items-center gap-1"
                  title="Alejar"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400 min-w-16 text-center">
                  {Math.round(zoomProfile * 100)}%
                </span>
                <button
                  onClick={() => setZoomProfile(Math.min(2, zoomProfile + 0.1))}
                  className="bg-gray-700 hover:bg-gray-600 rounded px-3 py-2 flex items-center gap-1"
                  title="Acercar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-gray-900 rounded overflow-hidden" style={{ height: '400px' }}>
              <canvas 
                ref={canvasProfileRef} 
                width={800} 
                height={400}
                className="w-full h-full"
                style={{ cursor: isPanningProfile ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDownProfile}
                onMouseMove={handleMouseMoveProfile}
                onMouseUp={handleMouseUpProfile}
                onMouseLeave={handleMouseUpProfile}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Vista lateral del hábitat | Haz clic y arrastra para desplazarte
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">4. Análisis y Problemas</h2>
            
            {problems.length === 0 ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>¡Distribución óptima! No hay problemas detectados.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {problems.map((problem, i) => (
                  <div key={i} className="flex items-start gap-2 text-yellow-400">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>{problem}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 bg-gray-700 rounded p-3">
              <h3 className="font-semibold mb-2">Módulos Instalados:</h3>
              <div className="space-y-1">
                {modules.length === 0 ? (
                  <p className="text-gray-400 text-sm">No hay módulos instalados</p>
                ) : (
                  modules.map((m, i) => {
                    const type = moduleTypes.find(t => t.id === m.type);
                    return (
                      <div 
                        key={m.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, m)}
                        className="flex items-center justify-between bg-gray-600 rounded p-2 cursor-move hover:bg-gray-500 transition"
                      >
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" style={{ color: type.color }} />
                          <span className="text-sm">{type.name}</span>
                        </div>
                        <button
                          onClick={() => setModules(modules.filter(mod => mod.id !== m.id))}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceHabitatDesigner;