import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle, Move, Info } from 'lucide-react';

const HabitatDesigner = () => {
  const [habitatType, setHabitatType] = useState('cilindro-vertical');
  const [crewSize, setCrewSize] = useState(4);
  const [dimensions, setDimensions] = useState({ length: 8.4, diameter: 5 });
  const [placedModules, setPlacedModules] = useState([]);
  const [draggedModule, setDraggedModule] = useState(null);
  const [validationIssues, setValidationIssues] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [selectedTopViewSection, setSelectedTopViewSection] = useState(0);
  const [draggedTopViewModule, setDraggedTopViewModule] = useState(null);
  const [moduleTopPositions, setModuleTopPositions] = useState({});
  const [topViewZoom, setTopViewZoom] = useState(100);
  const [topViewPanX, setTopViewPanX] = useState(0);
  const [topViewPanY, setTopViewPanY] = useState(0);
  const [mouseDown3D, setMouseDown3D] = useState(false);
  const [mouse3DPos, setMouse3DPos] = useState({ x: 0, y: 0 });
  const [camera3DRotation, setCamera3DRotation] = useState({ theta: Math.PI / 4, phi: Math.PI / 6 });
  const [threeLoaded, setThreeLoaded] = useState(false);
  const canvasRef = useRef(null);
  const topViewCanvasRef = useRef(null);
  const canvas3DRef = useRef(null);
  const scene3DRef = useRef(null);
  const camera3DRef = useRef(null);
  const renderer3DRef = useRef(null);

  const SCALE = 50;
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 500;
  const TERRAIN_Y = 420;
  const SECTION_HEIGHT = 2.8;
  const SECTIONS = crewSize <= 3 ? 2 : 3;
  const SECTION_NAMES = crewSize <= 3 
    ? ['Habitable Area', 'Service Area']
    : ['Upper Habitable Area', 'Lower Habitable Area', 'Service Area'];

  const habitatTypes = [
    { id: 'cilindro-vertical', name: 'Vertical Cylinder', locked: false },
    { id: 'cilindro-horizontal', name: 'Horizontal Cylinder', locked: true },
    { id: 'domo', name: 'Inflatable Dome', locked: true },
    { id: 'regolito', name: 'Printed Regolith', locked: true }
  ];

  const availableModules = [
    { id: 'cama', name: 'Sleeping Quarter', width: 0.76, length: 2, depth: 1.2, color: '#3B82F6', icon: '🛏️', weight: 50, serviceOnly: false },
    { id: 'cocina', name: 'Galley', width: 2.4, length: 2, depth: 1.6, color: '#EF4444', icon: '🍳', weight: 200, serviceOnly: false },
    { id: 'bano', name: 'Bathroom', width: 1.2, length: 2, depth: 1.6, color: '#10B981', icon: '🚿', weight: 150, serviceOnly: false },
    { id: 'operaciones', name: 'Operations Area', width: 3, length: 2.2, depth: 1.8, color: '#F59E0B', icon: '💻', weight: 120, serviceOnly: false },
    { id: 'laboratorio', name: 'Laboratory', width: 3, length: 2.1, depth: 1.8, color: '#EC4899', icon: '🔬', weight: 300, serviceOnly: false, optional: true },
    { id: 'invernadero', name: 'Greenhouse', width: 3.5, length: 2.2, depth: 2.2, color: '#22C55E', icon: '🌱', weight: 250, serviceOnly: false, optional: true },
    { id: 'gimnasio', name: 'Gymnasium', width: 1.5, length: 2, depth: 1.5, color: '#A855F7', icon: '🏋️', weight: 180, serviceOnly: false, optional: true },
    { id: 'combustible', name: 'Fuel Tank', width: 1.5, length: 2, depth: 1.5, color: '#DC2626', icon: '⛽', weight: 400, serviceOnly: true },
    { id: 'oxidante', name: 'Oxidizer Tank', width: 1.5, length: 2, depth: 1.5, color: '#F97316', icon: '🧪', weight: 400, serviceOnly: true },
    { id: 'soporte-vital', name: 'Life Support', width: 2, length: 2.5, depth: 1.8, color: '#06B6D4', icon: '💨', weight: 500, serviceOnly: true },
    { id: 'agua', name: 'Water Storage', width: 2, length: 2.2, depth: 2, color: '#3B82F6', icon: '💧', weight: 600, serviceOnly: true },
    { id: 'residuos', name: 'Waste Storage', width: 1.5, length: 1.8, depth: 1.5, color: '#78716C', icon: '🚽', weight: 300, serviceOnly: true }
  ];

  useEffect(() => {
    drawHabitat();
    drawTopView();
  }, [dimensions, placedModules, draggedModule, draggedTopViewModule, crewSize, zoomLevel, panX, panY, topViewZoom, topViewPanX, topViewPanY, selectedTopViewSection]);

  useEffect(() => {
    // Load Three.js dynamically
    if (window.THREE) {
      setThreeLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = () => {
      setThreeLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!threeLoaded) return;
    init3DView();
    return () => {
      if (renderer3DRef.current) {
        renderer3DRef.current.dispose();
      }
    };
  }, [threeLoaded]);

  useEffect(() => {
    if (!threeLoaded) return;
    render3DView();
  }, [dimensions, crewSize, camera3DRotation, threeLoaded]);

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
    const newLength = crewSize <= 3 ? 5.6 : 8.4;
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
    if (module.serviceOnly && section !== SECTIONS - 1) {
      return { canPlace: false, reason: 'This module can only be placed in the Service Area' };
    }

    const sectionStartY = section * SECTION_HEIGHT;
    const sectionEndY = (section + 1) * SECTION_HEIGHT;

    if (module.x < 0 || module.x + module.width > dimensions.diameter) {
      return { canPlace: false, reason: 'Module exceeds habitat width' };
    }

    if (module.y < sectionStartY || module.y + module.length > sectionEndY) {
      return { canPlace: false, reason: 'Module doesn\'t fit in section (exceeds 2.8m height)' };
    }

    return { canPlace: true };
  };

  const drawHabitat = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.save();
    
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
    
    const thrusterWidth = 25;
    const thrusterHeight = 35;
    const thrusterSpacing = cylWidth / 4;
    
    const thrusterPositions = [
      cylX + thrusterSpacing - thrusterWidth / 2,
      cylX + cylWidth / 2 - thrusterWidth / 2,
      cylX + cylWidth - thrusterSpacing - thrusterWidth / 2
    ];
    
    thrusterPositions.forEach(thrusterX => {
      const thrusterCenterX = thrusterX + thrusterWidth / 2;
      const thrusterTop = cylY + cylHeight;
      const thrusterBottom = cylY + cylHeight + thrusterHeight;
      
      ctx.fillStyle = '#6B7280';
      ctx.beginPath();
      ctx.moveTo(thrusterX, thrusterTop);
      ctx.lineTo(thrusterX + thrusterWidth, thrusterTop);
      ctx.lineTo(thrusterCenterX + thrusterWidth * 0.3, thrusterBottom);
      ctx.lineTo(thrusterCenterX - thrusterWidth * 0.3, thrusterBottom);
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#1F2937';
      ctx.beginPath();
      ctx.moveTo(thrusterCenterX - thrusterWidth * 0.25, thrusterBottom - 5);
      ctx.lineTo(thrusterCenterX + thrusterWidth * 0.25, thrusterBottom - 5);
      ctx.lineTo(thrusterCenterX + thrusterWidth * 0.2, thrusterBottom);
      ctx.lineTo(thrusterCenterX - thrusterWidth * 0.2, thrusterBottom);
      ctx.closePath();
      ctx.fill();
      
      for (let i = 1; i <= 2; i++) {
        const ringY = thrusterTop + (thrusterHeight / 3) * i;
        const ringWidth = thrusterWidth * (1 - (i * 0.15));
        ctx.strokeStyle = '#9CA3AF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(thrusterCenterX - ringWidth / 2, ringY);
        ctx.lineTo(thrusterCenterX + ringWidth / 2, ringY);
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
    
    const stairwellWidth = 1 * SCALE;
    const stairwellX = cylX + (cylWidth - stairwellWidth) / 2;
    const stairwellY = cylY + 20;
    const stairwellHeight = cylHeight - 20;
    
    ctx.fillStyle = '#D1D5DB';
    ctx.fillRect(stairwellX, stairwellY, stairwellWidth, stairwellHeight);
    
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 2;
    ctx.strokeRect(stairwellX, stairwellY, stairwellWidth, stairwellHeight);
    
    ctx.strokeStyle = '#A1A1AA';
    ctx.lineWidth = 1.5;
    const stepHeight = 15;
    for (let y = stairwellY; y < stairwellY + stairwellHeight; y += stepHeight) {
      ctx.beginPath();
      ctx.moveTo(stairwellX, y);
      ctx.lineTo(stairwellX + stairwellWidth, y);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    
    for (let i = 0; i < SECTIONS; i++) {
      const y = cylY + 20 + sectionHeight * i + sectionHeight / 2;
      ctx.fillText(`${SECTION_NAMES[i]} (2.8m)`, cylX + 10, y - sectionHeight / 2 + 20);
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
    
    const solarPanelWidth = 140;
    const solarPanelHeight = 80;
    const solarPanelY = cylY + cylHeight / 2 - solarPanelHeight / 2;
    const armLength = 20;
    
    const leftPanelX = cylX - solarPanelWidth - armLength;
    
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cylX, solarPanelY + solarPanelHeight / 2);
    ctx.lineTo(leftPanelX + solarPanelWidth, solarPanelY + solarPanelHeight / 2);
    ctx.stroke();
    
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(leftPanelX, solarPanelY, solarPanelWidth, solarPanelHeight);
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(leftPanelX, solarPanelY + (solarPanelHeight / 5) * i);
      ctx.lineTo(leftPanelX + solarPanelWidth, solarPanelY + (solarPanelHeight / 5) * i);
      ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(leftPanelX + (solarPanelWidth / 8) * i, solarPanelY);
      ctx.lineTo(leftPanelX + (solarPanelWidth / 8) * i, solarPanelY + solarPanelHeight);
      ctx.stroke();
    }
    
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 4;
    ctx.strokeRect(leftPanelX, solarPanelY, solarPanelWidth, solarPanelHeight);
    
    const rightPanelX = cylX + cylWidth + armLength;
    
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cylX + cylWidth, solarPanelY + solarPanelHeight / 2);
    ctx.lineTo(rightPanelX, solarPanelY + solarPanelHeight / 2);
    ctx.stroke();
    
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(rightPanelX, solarPanelY, solarPanelWidth, solarPanelHeight);
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(rightPanelX, solarPanelY + (solarPanelHeight / 5) * i);
      ctx.lineTo(rightPanelX + solarPanelWidth, solarPanelY + (solarPanelHeight / 5) * i);
      ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(rightPanelX + (solarPanelWidth / 8) * i, solarPanelY);
      ctx.lineTo(rightPanelX + (solarPanelWidth / 8) * i, solarPanelY + solarPanelHeight);
      ctx.stroke();
    }
    
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 4;
    ctx.strokeRect(rightPanelX, solarPanelY, solarPanelWidth, solarPanelHeight);
    
    ctx.fillStyle = '#1F2937';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${dimensions.length}m`, cylX + cylWidth + 10, cylY + cylHeight / 2);
    ctx.fillText(`${dimensions.diameter}m`, cylX + cylWidth / 2 - 15, cylY + cylHeight + 50);
    
    ctx.restore();
  };

  const drawTopView = () => {
    const canvas = topViewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const TOP_CANVAS_SIZE = 500;
    ctx.clearRect(0, 0, TOP_CANVAS_SIZE, TOP_CANVAS_SIZE);
    
    ctx.save();
    
    const scale = topViewZoom / 100;
    const offsetX = TOP_CANVAS_SIZE / 2;
    const offsetY = TOP_CANVAS_SIZE / 2;
    
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-offsetX + topViewPanX, -offsetY + topViewPanY);
    
    const centerX = TOP_CANVAS_SIZE / 2;
    const centerY = TOP_CANVAS_SIZE / 2;
    const radius = (dimensions.diameter / 2) * 40;
    
    ctx.fillStyle = '#E5E7EB';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    const stairwellRadius = (1 / 2) * 40;
    ctx.fillStyle = '#D1D5DB';
    ctx.beginPath();
    ctx.arc(centerX, centerY, stairwellRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.strokeStyle = '#A1A1AA';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + stairwellRadius * Math.cos(angle),
        centerY + stairwellRadius * Math.sin(angle)
      );
      ctx.stroke();
    }
    
    const modulesInSection = placedModules.filter(m => m.section === selectedTopViewSection);
    
    modulesInSection.forEach(module => {
      const moduleWidth = (module.width || 1) * 40;
      const moduleDepth = (module.depth || 1) * 40;
      
      const distanceFromCenter = (module.x + module.width / 2 - dimensions.diameter / 2) * 40;
      const defaultX = centerX + distanceFromCenter;
      const defaultY = centerY;
      
      const topPos = moduleTopPositions[module.id] || { x: defaultX, y: defaultY };
      
      ctx.fillStyle = module.color;
      ctx.fillRect(topPos.x - moduleWidth/2, topPos.y - moduleDepth/2, moduleWidth, moduleDepth);
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(topPos.x - moduleWidth/2, topPos.y - moduleDepth/2, moduleWidth, moduleDepth);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(module.icon, topPos.x, topPos.y);
    });
    
    if (draggedTopViewModule) {
      const moduleWidth = (draggedTopViewModule.width || 1) * 40;
      const moduleDepth = (draggedTopViewModule.depth || 1) * 40;
      
      ctx.fillStyle = draggedTopViewModule.color + '80';
      ctx.fillRect(draggedTopViewModule.topX - moduleWidth/2, draggedTopViewModule.topY - moduleDepth/2, moduleWidth, moduleDepth);
      
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeRect(draggedTopViewModule.topX - moduleWidth/2, draggedTopViewModule.topY - moduleDepth/2, moduleWidth, moduleDepth);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(draggedTopViewModule.icon, draggedTopViewModule.topX, draggedTopViewModule.topY);
    }
    
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(SECTION_NAMES[selectedTopViewSection], centerX, 30);
    ctx.fillText(`Top View - Diameter: ${dimensions.diameter}m`, centerX, TOP_CANVAS_SIZE - 20);
    
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
    
    let moduleSection = Math.floor(draggedModule.y / SECTION_HEIGHT);
    moduleSection = Math.max(0, Math.min(moduleSection, SECTIONS - 1));
    
    const sectionStartY = moduleSection * SECTION_HEIGHT;
    const sectionEndY = (moduleSection + 1) * SECTION_HEIGHT;
    
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
      setErrorMessage(`No space in ${SECTION_NAMES[moduleSection]}: ${validationResult.reason}`);
      setDraggedModule(null);
    }
  };

  const handleTopViewMouseDown = (e) => {
    const canvas = topViewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const TOP_CANVAS_SIZE = 500;
    const scale = topViewZoom / 100;
    
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    const offsetX = TOP_CANVAS_SIZE / 2;
    const offsetY = TOP_CANVAS_SIZE / 2;
    
    const mouseX = (rawX - offsetX) / scale + offsetX - topViewPanX;
    const mouseY = (rawY - offsetY) / scale + offsetY - topViewPanY;
    
    const centerX = TOP_CANVAS_SIZE / 2;
    const centerY = TOP_CANVAS_SIZE / 2;
    
    const modulesInSection = placedModules.filter(m => m.section === selectedTopViewSection);
    
    const clickedModule = modulesInSection.find(module => {
      const moduleWidth = (module.width || 1) * 40;
      const moduleDepth = (module.depth || 1) * 40;
      const distanceFromCenter = (module.x + module.width / 2 - dimensions.diameter / 2) * 40;
      const defaultX = centerX + distanceFromCenter;
      const defaultY = centerY;
      
      const topPos = moduleTopPositions[module.id] || { x: defaultX, y: defaultY };
      
      return mouseX >= topPos.x - moduleWidth/2 && 
             mouseX <= topPos.x + moduleWidth/2 && 
             mouseY >= topPos.y - moduleDepth/2 && 
             mouseY <= topPos.y + moduleDepth/2;
    });
    
    if (clickedModule) {
      const topPos = moduleTopPositions[clickedModule.id] || { 
        x: centerX + (clickedModule.x + clickedModule.width / 2 - dimensions.diameter / 2) * 40, 
        y: centerY 
      };
      
      setDraggedTopViewModule({
        ...clickedModule, 
        topX: topPos.x,
        topY: topPos.y,
        offsetX: mouseX - topPos.x, 
        offsetY: mouseY - topPos.y
      });
      setPlacedModules(placedModules.filter(m => m.id !== clickedModule.id));
    }
  };

  const handleTopViewMouseMove = (e) => {
    if (!draggedTopViewModule) return;
    
    const canvas = topViewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const TOP_CANVAS_SIZE = 500;
    const scale = topViewZoom / 100;
    
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    const offsetX = TOP_CANVAS_SIZE / 2;
    const offsetY = TOP_CANVAS_SIZE / 2;
    
    const mouseX = (rawX - offsetX) / scale + offsetX - topViewPanX;
    const mouseY = (rawY - offsetY) / scale + offsetY - topViewPanY;
    
    const newTopX = mouseX - draggedTopViewModule.offsetX;
    const newTopY = mouseY - draggedTopViewModule.offsetY;
    
    setDraggedTopViewModule({
      ...draggedTopViewModule, 
      topX: newTopX, 
      topY: newTopY
    });
  };

  const handleTopViewMouseUp = () => {
    if (!draggedTopViewModule) return;
    
    const TOP_CANVAS_SIZE = 500;
    const centerX = TOP_CANVAS_SIZE / 2;
    const centerY = TOP_CANVAS_SIZE / 2;
    const radius = (dimensions.diameter / 2) * 40;
    
    const moduleWidth = (draggedTopViewModule.width || 1) * 40;
    const moduleDepth = (draggedTopViewModule.depth || 1) * 40;
    
    // Verificar las 4 esquinas del módulo
    const corners = [
      {x: draggedTopViewModule.topX - moduleWidth/2, y: draggedTopViewModule.topY - moduleDepth/2},
      {x: draggedTopViewModule.topX + moduleWidth/2, y: draggedTopViewModule.topY - moduleDepth/2},
      {x: draggedTopViewModule.topX - moduleWidth/2, y: draggedTopViewModule.topY + moduleDepth/2},
      {x: draggedTopViewModule.topX + moduleWidth/2, y: draggedTopViewModule.topY + moduleDepth/2}
    ];
    
    const allCornersInside = corners.every(corner => {
      const dx = corner.x - centerX;
      const dy = corner.y - centerY;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
    
    if (allCornersInside) {
      // Calcular la nueva posición X del módulo basada en su posición en el Top View
      const distanceFromCenter = draggedTopViewModule.topX - centerX;
      const newX = (distanceFromCenter / 40) + (dimensions.diameter / 2) - (draggedTopViewModule.width / 2);
      
      const moduleToPlace = {
        ...draggedTopViewModule, 
        x: Math.max(0, Math.min(newX, dimensions.diameter - draggedTopViewModule.width)),
        section: selectedTopViewSection
      };
      
      // Guardar la posición en Top View
      setModuleTopPositions({
        ...moduleTopPositions,
        [moduleToPlace.id]: { x: draggedTopViewModule.topX, y: draggedTopViewModule.topY }
      });
      
      delete moduleToPlace.offsetX;
      delete moduleToPlace.offsetY;
      delete moduleToPlace.topX;
      delete moduleToPlace.topY;
      
      setPlacedModules([...placedModules, moduleToPlace]);
    } else {
      setErrorMessage(`Module doesn't fit inside the circular habitat`);
    }
    
    setDraggedTopViewModule(null);
  };

  const addModule = (moduleType) => {
    const targetSection = selectedSection !== null ? selectedSection : 0;
    const sectionStartY = targetSection * SECTION_HEIGHT;
    
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
      setErrorMessage(`No space in ${SECTION_NAMES[targetSection]}: ${validationResult.reason}`);
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

  const handleTopViewPan = (direction) => {
    const panStep = 20;
    switch(direction) {
      case 'up':
        setTopViewPanY(topViewPanY + panStep);
        break;
      case 'down':
        setTopViewPanY(topViewPanY - panStep);
        break;
      case 'left':
        setTopViewPanX(topViewPanX + panStep);
        break;
      case 'right':
        setTopViewPanX(topViewPanX - panStep);
        break;
      case 'reset':
        setTopViewPanX(0);
        setTopViewPanY(0);
        break;
    }
  };

  const init3DView = () => {
    if (!canvas3DRef.current) return;
    
    const THREE = window.THREE;
    const width = 600;
    const height = 500;
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);
    scene3DRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(15, 10, 15);
    camera.lookAt(0, 5, 0);
    camera3DRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvas3DRef.current,
      antialias: true 
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer3DRef.current = renderer;
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Grid
    const gridHelper = new THREE.GridHelper(50, 50, 0x666666, 0x444444);
    scene.add(gridHelper);
    
    render3DView();
  };

  const render3DView = () => {
    if (!scene3DRef.current || !camera3DRef.current || !renderer3DRef.current) return;
    
    const THREE = window.THREE;
    const scene = scene3DRef.current;
    const camera = camera3DRef.current;
    const renderer = renderer3DRef.current;
    
    // Clear previous habitat objects
    const objectsToRemove = [];
    scene.children.forEach(child => {
      if (child.userData.isHabitat) {
        objectsToRemove.push(child);
      }
    });
    objectsToRemove.forEach(obj => scene.remove(obj));
    
    // Cylinder dimensions
    const cylRadius = dimensions.diameter / 2;
    const cylHeight = dimensions.length;
    const groundClearance = 1; // 1 metro del suelo
    
    // Main cylinder - metallic white with panels
    const cylinderGeometry = new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 32);
    const cylinderMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf5f5f5,
      metalness: 0.8,
      roughness: 0.2
    });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.y = groundClearance + cylHeight / 2;
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    cylinder.userData.isHabitat = true;
    scene.add(cylinder);
    
    // Horizontal panel lines on cylinder
    const panelLineMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd0d0d0,
      metalness: 0.9,
      roughness: 0.1
    });
    
    const numPanels = Math.floor(cylHeight / 1.4);
    for (let i = 0; i < numPanels; i++) {
      const ringGeometry = new THREE.TorusGeometry(cylRadius + 0.02, 0.04, 8, 32);
      const ring = new THREE.Mesh(ringGeometry, panelLineMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = groundClearance + (i + 1) * (cylHeight / (numPanels + 1));
      ring.userData.isHabitat = true;
      scene.add(ring);
    }
    
    // Vertical panel lines
    const numVerticalPanels = 8;
    for (let i = 0; i < numVerticalPanels; i++) {
      const angle = (i * Math.PI * 2) / numVerticalPanels;
      const x = Math.cos(angle) * cylRadius;
      const z = Math.sin(angle) * cylRadius;
      
      const lineGeometry = new THREE.BoxGeometry(0.06, cylHeight, 0.06);
      const line = new THREE.Mesh(lineGeometry, panelLineMaterial);
      line.position.set(x, groundClearance + cylHeight / 2, z);
      line.userData.isHabitat = true;
      scene.add(line);
    }
    
    // Hatch/Airlock at bottom side - door design
    const hatchMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      metalness: 0.6,
      roughness: 0.3
    });
    
    // Hatch door (rectangular with rounded top)
    const hatchWidth = 1;
    const hatchHeight = 1.8;
    const hatchDepth = 0.12;
    
    // Main door panel
    const doorGeometry = new THREE.BoxGeometry(hatchWidth, hatchHeight, hatchDepth);
    const door = new THREE.Mesh(doorGeometry, hatchMaterial);
    door.position.set(cylRadius + hatchDepth/2, groundClearance + 1.2, 0);
    door.userData.isHabitat = true;
    scene.add(door);
    
    // Door frame
    const frameMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf5f5f5,
      metalness: 0.8,
      roughness: 0.2
    });
    
    // Top frame
    const topFrameGeometry = new THREE.BoxGeometry(hatchWidth + 0.15, 0.1, hatchDepth + 0.05);
    const topFrame = new THREE.Mesh(topFrameGeometry, frameMaterial);
    topFrame.position.set(cylRadius + hatchDepth/2, groundClearance + 1.2 + hatchHeight/2 + 0.05, 0);
    topFrame.userData.isHabitat = true;
    scene.add(topFrame);
    
    // Bottom frame
    const bottomFrame = new THREE.Mesh(topFrameGeometry, frameMaterial);
    bottomFrame.position.set(cylRadius + hatchDepth/2, groundClearance + 1.2 - hatchHeight/2 - 0.05, 0);
    bottomFrame.userData.isHabitat = true;
    scene.add(bottomFrame);
    
    // Left frame
    const sideFrameGeometry = new THREE.BoxGeometry(0.1, hatchHeight + 0.2, hatchDepth + 0.05);
    const leftFrame = new THREE.Mesh(sideFrameGeometry, frameMaterial);
    leftFrame.position.set(cylRadius + hatchDepth/2, groundClearance + 1.2, -hatchWidth/2 - 0.05);
    leftFrame.userData.isHabitat = true;
    scene.add(leftFrame);
    
    // Right frame
    const rightFrame = new THREE.Mesh(sideFrameGeometry, frameMaterial);
    rightFrame.position.set(cylRadius + hatchDepth/2, groundClearance + 1.2, hatchWidth/2 + 0.05);
    rightFrame.userData.isHabitat = true;
    scene.add(rightFrame);
    
    // Door window (rectangular)
    const windowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      metalness: 0.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.4
    });
    const windowGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.13);
    const doorWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    doorWindow.position.set(cylRadius + hatchDepth/2, groundClearance + 1.2 + 0.4, 0);
    doorWindow.userData.isHabitat = true;
    scene.add(doorWindow);
    
    // Door handle
    const handleGeometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
    const handle = new THREE.Mesh(handleGeometry, frameMaterial);
    handle.position.set(cylRadius + hatchDepth/2 + 0.08, groundClearance + 1.2, 0.3);
    handle.userData.isHabitat = true;
    scene.add(handle);
    
    // Small platform/steps near hatch
    const platformGeometry = new THREE.BoxGeometry(0.8, 0.08, 1.2);
    const platformMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xfafafa,
      metalness: 0.5,
      roughness: 0.4
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(cylRadius + 0.5, groundClearance + 0.3, 0);
    platform.userData.isHabitat = true;
    scene.add(platform);
    
    // Steps
    const stepGeometry = new THREE.BoxGeometry(0.6, 0.05, 0.35);
    const step1 = new THREE.Mesh(stepGeometry, platformMaterial);
    step1.position.set(cylRadius + 0.6, groundClearance + 0.15, 0);
    step1.userData.isHabitat = true;
    scene.add(step1);
    
    // Top dome
    const topDomeGeometry = new THREE.SphereGeometry(cylRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const topDome = new THREE.Mesh(topDomeGeometry, cylinderMaterial);
    topDome.position.y = groundClearance + cylHeight;
    topDome.castShadow = true;
    topDome.receiveShadow = true;
    topDome.userData.isHabitat = true;
    scene.add(topDome);
    
    // Landing gear - 3 legs
    const legMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x555555,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const legPositions = [
      { angle: 0 },
      { angle: (Math.PI * 2) / 3 },
      { angle: (Math.PI * 4) / 3 }
    ];
    
    legPositions.forEach(pos => {
      const legGroup = new THREE.Group();
      legGroup.userData.isHabitat = true;
      
      // Main leg strut
      const legGeometry = new THREE.CylinderGeometry(0.1, 0.15, groundClearance + 0.5, 8);
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.y = (groundClearance + 0.5) / 2;
      legGroup.add(leg);
      
      // Foot pad
      const footGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
      const foot = new THREE.Mesh(footGeometry, legMaterial);
      foot.position.y = 0.05;
      legGroup.add(foot);
      
      // Position leg around cylinder
      const x = Math.cos(pos.angle) * (cylRadius - 0.5);
      const z = Math.sin(pos.angle) * (cylRadius - 0.5);
      legGroup.position.set(x, 0, z);
      
      // Tilt leg outward slightly
      const tiltAngle = Math.atan2(z, x);
      legGroup.rotation.z = Math.cos(tiltAngle) * 0.1;
      legGroup.rotation.x = Math.sin(tiltAngle) * 0.1;
      
      scene.add(legGroup);
    });
    
    // Thrusters at bottom
    const thrusterMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4a5568,
      metalness: 0.9,
      roughness: 0.1
    });
    
    const thrusterPositions = [
      { angle: Math.PI / 6 },
      { angle: Math.PI / 2 },
      { angle: (5 * Math.PI) / 6 },
      { angle: (7 * Math.PI) / 6 },
      { angle: (3 * Math.PI) / 2 },
      { angle: (11 * Math.PI) / 6 }
    ];
    
    thrusterPositions.forEach(pos => {
      const thrusterGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8);
      const thruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
      const x = Math.cos(pos.angle) * (cylRadius - 0.3);
      const z = Math.sin(pos.angle) * (cylRadius - 0.3);
      thruster.position.set(x, groundClearance + 0.4, z);
      thruster.castShadow = true;
      thruster.userData.isHabitat = true;
      scene.add(thruster);
      
      // Nozzle
      const nozzleGeometry = new THREE.CylinderGeometry(0.25, 0.15, 0.3, 8);
      const nozzleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2d3748,
        metalness: 0.9,
        roughness: 0.1
      });
      const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
      nozzle.position.set(x, groundClearance + 0.05, z);
      nozzle.userData.isHabitat = true;
      scene.add(nozzle);
    });
    
    // Solar panels
    const panelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1e3a8a,
      metalness: 0.5,
      roughness: 0.3
    });
    
    const panelGeometry = new THREE.BoxGeometry(4, 2, 0.1);
    
    // Left panel
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-cylRadius - 2.5, groundClearance + cylHeight / 2, 0);
    leftPanel.rotation.y = Math.PI / 2;
    leftPanel.castShadow = true;
    leftPanel.userData.isHabitat = true;
    scene.add(leftPanel);
    
    // Left arm
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x555555,
      metalness: 0.8,
      roughness: 0.2
    });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-cylRadius - 1, groundClearance + cylHeight / 2, 0);
    leftArm.rotation.z = Math.PI / 2;
    leftArm.userData.isHabitat = true;
    scene.add(leftArm);
    
    // Right panel
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(cylRadius + 2.5, groundClearance + cylHeight / 2, 0);
    rightPanel.rotation.y = Math.PI / 2;
    rightPanel.castShadow = true;
    rightPanel.userData.isHabitat = true;
    scene.add(rightPanel);
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(cylRadius + 1, groundClearance + cylHeight / 2, 0);
    rightArm.rotation.z = Math.PI / 2;
    rightArm.userData.isHabitat = true;
    scene.add(rightArm);
    
    // Update camera position based on rotation
    const radius = 20;
    camera.position.x = radius * Math.sin(camera3DRotation.theta) * Math.cos(camera3DRotation.phi);
    camera.position.y = radius * Math.sin(camera3DRotation.phi);
    camera.position.z = radius * Math.cos(camera3DRotation.theta) * Math.cos(camera3DRotation.phi);
    camera.lookAt(0, groundClearance + cylHeight / 2, 0);
    
    renderer.render(scene, camera);
  };

  const handle3DMouseDown = (e) => {
    setMouseDown3D(true);
    setMouse3DPos({ x: e.clientX, y: e.clientY });
  };

  const handle3DMouseMove = (e) => {
    if (!mouseDown3D) return;
    
    const deltaX = e.clientX - mouse3DPos.x;
    const deltaY = e.clientY - mouse3DPos.y;
    
    setCamera3DRotation(prev => ({
      theta: prev.theta - deltaX * 0.01,
      phi: Math.max(0.1, Math.min(Math.PI - 0.1, prev.phi - deltaY * 0.01))
    }));
    
    setMouse3DPos({ x: e.clientX, y: e.clientY });
  };

  const handle3DMouseUp = () => {
    setMouseDown3D(false);
  };

  const validateDesign = () => {
    const issues = [];
    
    const sectionArea = dimensions.diameter * SECTION_HEIGHT;
    
    for (let s = 0; s < SECTIONS; s++) {
      const modulesInSection = placedModules.filter(m => m.section === s);
      const usedArea = modulesInSection.reduce((sum, m) => sum + (m.width * m.length), 0);
      const utilizationPercent = (usedArea / sectionArea * 100).toFixed(1);
      
      if (utilizationPercent > 90) {
        issues.push({ type: 'warning', msg: `${SECTION_NAMES[s]}: ${utilizationPercent}% - Very crowded` });
      } else if (utilizationPercent > 0) {
        issues.push({ type: 'info', msg: `${SECTION_NAMES[s]}: ${utilizationPercent}% of space used (${usedArea.toFixed(1)}m² / ${sectionArea.toFixed(1)}m²)` });
      }
    }
    
    const totalArea = dimensions.diameter * dimensions.length;
    const usedArea = placedModules.reduce((sum, m) => sum + (m.width * m.length), 0);
    const utilizationPercent = (usedArea / totalArea * 100).toFixed(1);
    
    issues.push({ type: 'success', msg: `Total habitat usage: ${utilizationPercent}%` });
    
    const hasGalley = placedModules.some(m => m.id.startsWith('cocina'));
    const hasBathroom = placedModules.some(m => m.id.startsWith('bano'));
    const hasSleepingQuarter = placedModules.some(m => m.id.startsWith('cama'));
    const hasOperations = placedModules.some(m => m.id.startsWith('operaciones'));
    const hasLifeSupport = placedModules.some(m => m.id.startsWith('soporte-vital'));
    const hasFuelTank = placedModules.some(m => m.id.startsWith('combustible'));
    const hasOxidizerTank = placedModules.some(m => m.id.startsWith('oxidante'));
    const hasWaterStorage = placedModules.some(m => m.id.startsWith('agua'));
    const hasWasteStorage = placedModules.some(m => m.id.startsWith('residuos'));
    
    if (!hasGalley) issues.push({ type: 'warning', msg: 'Missing required module: Galley' });
    if (!hasBathroom) issues.push({ type: 'warning', msg: 'Missing required module: Bathroom' });
    if (!hasSleepingQuarter) issues.push({ type: 'warning', msg: 'Missing required module: Sleeping Quarter' });
    if (!hasOperations) issues.push({ type: 'warning', msg: 'Missing required module: Operations Area' });
    if (!hasLifeSupport) issues.push({ type: 'warning', msg: 'Missing required module: Life Support' });
    if (!hasFuelTank) issues.push({ type: 'warning', msg: 'Missing required module: Fuel Tank' });
    if (!hasOxidizerTank) issues.push({ type: 'warning', msg: 'Missing required module: Oxidizer Tank' });
    if (!hasWaterStorage) issues.push({ type: 'warning', msg: 'Missing required module: Water Storage' });
    if (!hasWasteStorage) issues.push({ type: 'warning', msg: 'Missing required module: Waste Storage' });
    
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
          <p className="text-slate-300">Space Apps Challenge - Space Habitat Designer</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Crew Size</label>
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
                    ? '2-3 crew: 1 habitable + 1 service area (5.6m)'
                    : '4-6 crew: 2 habitable (upper/lower) + 1 service area (8.4m)'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Spacecraft Module Shape</label>
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
                <label className="block text-sm font-medium mb-2">Total Length (automatic)</label>
                <div className="bg-slate-700 p-4 rounded text-center">
                  <div className="text-3xl font-bold text-blue-400">{dimensions.length}m</div>
                  <div className="text-xs text-slate-400 mt-1">{SECTIONS} sections × 2.8m each</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Diameter (meters)</label>
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
                    <span>Configuration:</span>
                    <span className="font-bold">{SECTIONS} sections × 2.8m</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Total volume:</span>
                    <span className="font-bold">{(Math.PI * Math.pow(dimensions.diameter/2, 2) * dimensions.length).toFixed(2)}m³</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Area per section:</span>
                    <span className="font-bold">{(dimensions.diameter * SECTION_HEIGHT).toFixed(2)}m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total floor area:</span>
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
              <h2 className="text-xl font-bold mb-4">Available Modules</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Add modules to:</label>
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
              
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2">
                {availableModules.map(module => (
                  <button
                    key={module.id}
                    onClick={() => addModule(module)}
                    className={`p-2 rounded-lg transition-all transform hover:scale-105 active:scale-95 active:bg-blue-600 active:border-blue-400 active:shadow-lg flex flex-col items-center gap-1 ${
                      module.serviceOnly 
                        ? 'bg-slate-600 hover:bg-slate-500 border-2 border-orange-500' 
                        : 'bg-slate-700 hover:bg-slate-600 border-2 border-transparent'
                    }`}
                  >
                    <div className="text-xl">{module.icon}</div>
                    <div className="text-xs font-medium text-center leading-tight">{module.name}</div>
                    <div className="text-xs text-slate-400">
                      <div>L:{module.width}m</div>
                      <div>H:{module.length}m</div>
                      {module.depth && <div className="text-xs text-slate-500">D:{module.depth}m</div>}
                    </div>
                    {module.serviceOnly && (
                      <div className="text-xs text-orange-400 font-semibold">Service</div>
                    )}
                    {module.optional && (
                      <div className="text-xs text-green-400 font-semibold">Optional</div>
                    )}
                  </button>
                ))}
              </div>

              {placedModules.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <h3 className="font-bold mb-3">Placed Modules ({placedModules.length})</h3>
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
                    2D Profile View
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
                      title="Center view"
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
                Drag modules - Modules can overlap (different depths) - Zoom +/− - Arrows to navigate
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    Top View (Circular Cross-Section)
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTopViewZoom(Math.max(10, topViewZoom - 10))}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition"
                      disabled={topViewZoom <= 10}
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold min-w-[60px] text-center">
                      {topViewZoom}%
                    </span>
                    <button
                      onClick={() => setTopViewZoom(Math.min(200, topViewZoom + 10))}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition"
                      disabled={topViewZoom >= 200}
                    >
                      +
                    </button>
                    <button
                      onClick={() => setTopViewZoom(100)}
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
                  value={topViewZoom}
                  onChange={(e) => setTopViewZoom(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Section to View:</label>
                <div className="flex gap-2">
                  {Array.from({ length: SECTIONS }, (_, i) => i).map(section => (
                    <button
                      key={section}
                      onClick={() => setSelectedTopViewSection(section)}
                      className={`flex-1 p-3 rounded transition ${
                        selectedTopViewSection === section
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {SECTION_NAMES[section]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-4 flex justify-center relative">
                <canvas
                  ref={topViewCanvasRef}
                  width={500}
                  height={500}
                  onMouseDown={handleTopViewMouseDown}
                  onMouseMove={handleTopViewMouseMove}
                  onMouseUp={handleTopViewMouseUp}
                  onMouseLeave={handleTopViewMouseUp}
                  className="border border-slate-700 rounded cursor-move"
                />
                
                <div className="absolute bottom-4 left-4 bg-slate-800 bg-opacity-70 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                  <div className="grid grid-cols-3 gap-1" style={{ width: '80px' }}>
                    <div></div>
                    <button
                      onClick={() => handleTopViewPan('up')}
                      className="p-1 bg-slate-700 bg-opacity-80 hover:bg-slate-600 rounded transition flex items-center justify-center text-xs"
                    >
                      ▲
                    </button>
                    <div></div>
                    <button
                      onClick={() => handleTopViewPan('left')}
                      className="p-1 bg-slate-700 bg-opacity-80 hover:bg-slate-600 rounded transition flex items-center justify-center text-xs"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => handleTopViewPan('reset')}
                      className="p-1 bg-blue-600 bg-opacity-80 hover:bg-blue-500 rounded transition text-xs"
                      title="Center view"
                    >
                      ⊙
                    </button>
                    <button
                      onClick={() => handleTopViewPan('right')}
                      className="p-1 bg-slate-700 bg-opacity-80 hover:bg-slate-600 rounded transition flex items-center justify-center text-xs"
                    >
                      ▶
                    </button>
                    <div></div>
                    <button
                      onClick={() => handleTopViewPan('down')}
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
                Drag modules to reposition - Zoom +/− - Arrows to navigate
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                3D External Preview
              </h2>
              
              <div className="bg-slate-900 rounded-lg p-4 flex justify-center">
                <canvas
                  ref={canvas3DRef}
                  width={600}
                  height={500}
                  onMouseDown={handle3DMouseDown}
                  onMouseMove={handle3DMouseMove}
                  onMouseUp={handle3DMouseUp}
                  onMouseLeave={handle3DMouseUp}
                  className="border border-slate-700 rounded cursor-grab active:cursor-grabbing"
                />
              </div>
              <p className="text-sm text-slate-400 mt-2 text-center">
                Drag to rotate the view - Exterior structure only
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4">Design Validation</h2>
              <div className="mb-3 p-3 bg-blue-900 bg-opacity-30 border border-blue-500 rounded text-xs text-blue-200">
                Modules can overlap in 2D view as they are at different depths within the circular cylinder. The central stairwell (1m diameter, shown in light gray) connects all sections.
              </div>
              <div className="space-y-2">
                {validationIssues.length === 0 ? (
                  <p className="text-slate-400">Add modules to start...</p>
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

        <div className="mt-6 bg-slate-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            Habitat Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚖️</span>
                <h3 className="text-sm font-medium text-slate-300">Total Weight</h3>
              </div>
              <div className="text-3xl font-bold text-blue-400">
                {placedModules.reduce((sum, m) => sum + (m.weight || 0), 0)} kg
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Interior modules
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📦</span>
                <h3 className="text-sm font-medium text-slate-300">Total Volume</h3>
              </div>
              <div className="text-3xl font-bold text-purple-400">
                {(Math.PI * Math.pow(dimensions.diameter/2, 2) * dimensions.length).toFixed(2)} m³
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Cylinder capacity
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📥</span>
                <h3 className="text-sm font-medium text-slate-300">Occupied Volume</h3>
              </div>
              <div className="text-3xl font-bold text-orange-400">
                {placedModules.reduce((sum, m) => {
                  const moduleVolume = m.width * m.length * SECTION_HEIGHT;
                  return sum + moduleVolume;
                }, 0).toFixed(2)} m³
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Space used by modules
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📤</span>
                <h3 className="text-sm font-medium text-slate-300">Available Volume</h3>
              </div>
              <div className="text-3xl font-bold text-green-400">
                {(() => {
                  const totalVolume = Math.PI * Math.pow(dimensions.diameter/2, 2) * dimensions.length;
                  const occupiedVolume = placedModules.reduce((sum, m) => {
                    return sum + (m.width * m.length * SECTION_HEIGHT);
                  }, 0);
                  return (totalVolume - occupiedVolume).toFixed(2);
                })()}
                {' '}m³
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Remaining free space
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📊</span>
                <h3 className="text-sm font-medium text-slate-300">Occupancy</h3>
              </div>
              <div className="text-3xl font-bold text-cyan-400">
                {(() => {
                  const totalArea = dimensions.diameter * dimensions.length;
                  const usedArea = placedModules.reduce((sum, m) => sum + (m.width * m.length), 0);
                  return (usedArea / totalArea * 100).toFixed(1);
                })()}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Used floor area
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👥</span>
                <h3 className="text-sm font-medium text-slate-300">Crew Members</h3>
              </div>
              <div className="text-3xl font-bold text-yellow-400">
                {crewSize}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Configured capacity
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🔲</span>
                <h3 className="text-sm font-medium text-slate-300">Sections</h3>
              </div>
              <div className="text-3xl font-bold text-pink-400">
                {SECTIONS}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {SECTIONS === 2 ? '1 habitable + 1 service' : '2 habitable (upper/lower) + 1 service'}
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📏</span>
                <h3 className="text-sm font-medium text-slate-300">Dimensions</h3>
              </div>
              <div className="text-2xl font-bold text-indigo-400">
                ⌀{dimensions.diameter}m × {dimensions.length}m
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Diameter × Length
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitatDesigner;