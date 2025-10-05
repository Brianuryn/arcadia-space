import React from 'react';
import ModuleList from './ModuleList';
import Button from './ui/Button';
import Input from './ui/Input';

const ControlPanel = ({ 
  habitatConfig, 
  onConfigChange, 
  selectedModule, 
  onClearAll, 
  onExport, 
  stats,
  onCenterView,
  onZoomIn,
  onZoomOut,
  zoom
}) => {
  const handleConfigChange = (field, value) => {
    onConfigChange({
      ...habitatConfig,
      [field]: field === 'shape' ? value : parseInt(value) || value
    });
  };

  const handleToggleChange = (field) => {
    onConfigChange({
      ...habitatConfig,
      [field]: !habitatConfig[field]
    });
  };

  return (
    <div className="control-panel">
      <div className="control-section">
        <h3>Configuración del Hábitat</h3>
        
        <div className="form-group">
          <label>Forma del Hábitat:</label>
          <select 
            value={habitatConfig.shape}
            onChange={(e) => handleConfigChange('shape', e.target.value)}
          >
            <option value="rectangular">Rectangular</option>
            <option value="circular">Circular</option>
            <option value="l-shaped">Forma de L</option>
            <option value="t-shaped">Forma de T</option>
          </select>
        </div>

        <div className="form-group">
          <Input
            label="Ancho (metros):"
            type="number"
            value={habitatConfig.width}
            onChange={(e) => handleConfigChange('width', e.target.value)}
            min="10"
            max="100"
          />
        </div>
        
        {habitatConfig.shape !== 'circular' && (
          <div className="form-group">
            <Input
              label="Alto (metros):"
              type="number"
              value={habitatConfig.height}
              onChange={(e) => handleConfigChange('height', e.target.value)}
              min="10"
              max="100"
            />
          </div>
        )}

        <div className="form-group">
          <Input
            label="Tamaño de la tripulación:"
            type="number"
            value={habitatConfig.crewSize}
            onChange={(e) => handleConfigChange('crewSize', e.target.value)}
            min="1"
            max="50"
          />
        </div>
        
        <div className="form-group">
          <Input
            label="Consumo energético (kW):"
            type="number"
            value={habitatConfig.energyConsumption}
            onChange={(e) => handleConfigChange('energyConsumption', e.target.value)}
            min="1"
            max="1000"
          />
        </div>

        <div className="toggle-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={habitatConfig.showGrid}
              onChange={() => handleToggleChange('showGrid')}
            />
            Mostrar cuadrícula
          </label>
          
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={habitatConfig.gridSnap}
              onChange={() => handleToggleChange('gridSnap')}
            />
            Ajustar a cuadrícula
          </label>
        </div>
      </div>

      <div className="control-section">
        <h3>Controles de Vista</h3>
        <div className="view-controls">
          <Button onClick={onCenterView} variant="secondary">
            Centrar Vista
          </Button>
          <div className="zoom-controls">
            <Button onClick={onZoomOut} variant="secondary" small>
              -
            </Button>
            <span className="zoom-display">{Math.round(zoom * 100)}%</span>
            <Button onClick={onZoomIn} variant="secondary" small>
              +
            </Button>
          </div>
        </div>
      </div>

      <div className="control-section">
        <h3>Módulos Disponibles</h3>
        <ModuleList />
      </div>

      <div className="control-section">
        <h3>Información del Módulo</h3>
        <div className="module-info">
          {selectedModule ? (
            <>
              <h4>{selectedModule.name} {selectedModule.icon}</h4>
              <p><strong>Tipo:</strong> {selectedModule.type === 'interior' ? 'Interior' : 'Exterior'}</p>
              <p><strong>Dimensiones:</strong> {selectedModule.width} × {selectedModule.height} m</p>
              <p><strong>Peso:</strong> {selectedModule.weight} kg</p>
              <p><strong>Costo:</strong> ${(selectedModule.weight * 10000).toLocaleString()}</p>
              <p><strong>Energía:</strong> {selectedModule.energyConsumption > 0 ? '+' : ''}{selectedModule.energyConsumption} kW</p>
            </>
          ) : (
            <p>Selecciona un módulo para ver su información</p>
          )}
        </div>
      </div>

      <div className="control-section">
        <h3>Estadísticas</h3>
        <div className="stats-preview">
          <div className="stat-item">
            <span>Costo Total:</span>
            <strong>${stats.totalCost.toLocaleString()}</strong>
          </div>
          <div className="stat-item">
            <span>Energía Neta:</span>
            <strong className={stats.energyDeficit > 0 ? 'energy-warning' : 'energy-ok'}>
              {stats.totalEnergy} kW
            </strong>
          </div>
          <div className="stat-item">
            <span>Módulos:</span>
            <strong>{stats.moduleCount}</strong>
          </div>
          {stats.energyDeficit > 0 && (
            <div className="energy-alert">
              ⚠️ Déficit de {stats.energyDeficit} kW
            </div>
          )}
        </div>
      </div>

      <div className="control-section">
        <h3>Acciones</h3>
        <div className="action-buttons">
          <Button onClick={onClearAll} variant="secondary">
            Limpiar Todo
          </Button>
          <Button onClick={onExport}>
            Exportar Diseño
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;