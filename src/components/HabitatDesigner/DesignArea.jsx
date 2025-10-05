import React, { useCallback, useEffect, useState } from 'react';

const SCALE = 10; // 1 unidad = 10 píxeles

const DesignArea = ({
  habitatConfig,
  modules,
  selectedModule,
  onModuleSelect,
  onModuleMove,
  onModuleAdd,
  onModuleDelete,
  onViewMove,
  viewOffset,
  zoom,
  canvasRef
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Dibujar en el canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Aplicar transformaciones de vista
    ctx.save();
    ctx.translate(viewOffset.x, viewOffset.y);
    ctx.scale(zoom, zoom);

    // Dibujar cuadrícula de fondo
    if (habitatConfig.showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // Dibujar forma del hábitat
    drawHabitatShape(ctx, habitatConfig);

    // Dibujar módulos
    modules.forEach(module => {
      drawModule(ctx, module, module === selectedModule);
    });

    ctx.restore();
  }, [modules, selectedModule, habitatConfig, viewOffset, zoom]);

  // Dibujar cuadrícula
  const drawGrid = (ctx, width, height) => {
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 1;

    const gridSize = SCALE;
    const startX = -viewOffset.x / zoom;
    const startY = -viewOffset.y / zoom;
    const endX = startX + width / zoom;
    const endY = startY + height / zoom;

    for (let x = Math.floor(startX / gridSize) * gridSize; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (let y = Math.floor(startY / gridSize) * gridSize; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  };

  // Dibujar forma del hábitat
  const drawHabitatShape = (ctx, config) => {
    ctx.strokeStyle = '#4FD1C5';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(79, 209, 197, 0.1)';

    switch (config.shape) {
      case 'circular':
        const radius = config.width / 2;
        ctx.beginPath();
        ctx.arc(config.width / 2, config.height / 2, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        break;

      case 'l-shaped':
        ctx.beginPath();
        ctx.rect(0, 0, config.width * 0.7, config.height);
        ctx.rect(config.width * 0.7, config.height * 0.7, config.width * 0.3, config.height * 0.3);
        ctx.fill();
        ctx.stroke();
        break;

      case 't-shaped':
        ctx.beginPath();
        ctx.rect(config.width * 0.3, 0, config.width * 0.4, config.height);
        ctx.rect(0, config.height * 0.7, config.width, config.height * 0.3);
        ctx.fill();
        ctx.stroke();
        break;

      default: // rectangular
        ctx.beginPath();
        ctx.rect(0, 0, config.width, config.height);
        ctx.fill();
        ctx.stroke();
        break;
    }
  };

  // Dibujar módulo
  const drawModule = (ctx, module, isSelected) => {
    const x = module.x * SCALE;
    const y = module.y * SCALE;
    const width = module.width * SCALE;
    const height = module.height * SCALE;

    const isInterior = module.type === 'interior';
    const fillColor = isInterior ? 'rgba(72, 187, 120, 0.3)' : 'rgba(237, 137, 54, 0.3)';
    const borderColor = isInterior ? '#48BB78' : '#ED8936';

    // Relleno
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);

    // Borde
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.strokeRect(x, y, width, height);

    // Texto
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(module.icon, x + width / 2, y + height / 2 - 5);
    ctx.fillText(module.name, x + width / 2, y + height / 2 + 10);

    // Indicador de tipo
    ctx.font = '10px Arial';
    ctx.fillText(module.type === 'interior' ? 'INT' : 'EXT', x + width / 2, y + height - 5);
  };

  // Convertir coordenadas del mouse a coordenadas del mundo
  const getWorldCoordinates = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - viewOffset.x) / zoom / SCALE;
    const y = (clientY - rect.top - viewOffset.y) / zoom / SCALE;
    return { x, y };
  };

  // Manejar clic en el canvas
  const handleMouseDown = (e) => {
    const worldPos = getWorldCoordinates(e.clientX, e.clientY);

    if (e.button === 2 || e.ctrlKey) { // Botón derecho o Ctrl para pan
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    // Buscar módulo en la posición del clic
    const clickedModule = modules.find(module =>
      worldPos.x >= module.x && worldPos.x <= module.x + module.width &&
      worldPos.y >= module.y && worldPos.y <= module.y + module.height
    );

    if (clickedModule) {
      onModuleSelect(clickedModule);
      setIsDragging(true);
      setDragOffset({
        x: worldPos.x - clickedModule.x,
        y: worldPos.y - clickedModule.y
      });
    } else {
      onModuleSelect(null);
    }
  };

  // Manejar movimiento del mouse
  const handleMouseMove = (e) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      onViewMove(deltaX, deltaY);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!isDragging || !selectedModule) return;

    const worldPos = getWorldCoordinates(e.clientX, e.clientY);
    let newX = worldPos.x - dragOffset.x;
    let newY = worldPos.y - dragOffset.y;

    // Ajustar a cuadrícula si está activado
    if (habitatConfig.gridSnap) {
      newX = Math.round(newX);
      newY = Math.round(newY);
    }

    onModuleMove(selectedModule.id, newX, newY);
  };

  // Manejar fin de interacción
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  // Manejar rueda del mouse para zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    // Aquí podrías implementar zoom hacia el punto del mouse
  };

  // Manejar soltar módulo
  const handleDrop = (e) => {
    e.preventDefault();
    const moduleType = e.dataTransfer.getData('moduleType');
    
    if (moduleType) {
      const worldPos = getWorldCoordinates(e.clientX, e.clientY);
      let x = worldPos.x;
      let y = worldPos.y;

      // Ajustar a cuadrícula si está activado
      if (habitatConfig.gridSnap) {
        x = Math.round(x);
        y = Math.round(y);
      }

      onModuleAdd(moduleType, x, y);
    }
  };

  // Permitir soltar
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Prevenir menú contextual
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  // Actualizar canvas cuando cambian los módulos o la configuración
  useEffect(() => {
    draw();
  }, [draw]);

  // Actualizar tamaño del canvas
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth * 0.7;
      canvasRef.current.height = window.innerHeight * 0.8;
      draw();
    }
  }, [draw]);

  return (
    <div className="design-area">
      <div className="design-header">
        <h2>Vista del Hábitat - Forma {habitatConfig.shape}</h2>
        <div className="design-stats">
          <div className="stat-badge">
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </div>
          <div className="stat-badge">
            <span>Usa Ctrl + Arrastrar para mover la vista</span>
          </div>
        </div>
      </div>
      
      <div 
        className="canvas-container"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onContextMenu={handleContextMenu}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
      </div>
    </div>
  );
};

export default DesignArea;