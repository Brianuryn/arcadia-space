import React from 'react';
import { availableModules } from '../../data/modules';

const ModuleList = () => {
  const handleDragStart = (e, moduleId) => {
    e.dataTransfer.setData('moduleType', moduleId);
  };

  return (
    <div className="module-list">
      {availableModules.map(module => (
        <div
          key={module.id}
          className="module-item"
          draggable
          onDragStart={(e) => handleDragStart(e, module.id)}
        >
          <div className="module-icon">{module.icon}</div>
          <div className="module-name">{module.name}</div>
          <div className="module-details">
            {module.width}×{module.height}m
          </div>
        </div>
      ))}
    </div>
  );
};

export default ModuleList;