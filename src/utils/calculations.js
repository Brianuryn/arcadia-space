export const calculateCost = (modules) => {
  return modules.reduce((total, module) => total + (module.weight * 10000), 0);
};

export const calculateEnergyBalance = (modules) => {
  return modules.reduce((total, module) => total + module.energyConsumption, 0);
};

export const validateModulePlacement = (module, x, y, habitatWidth, habitatHeight, existingModules) => {
  // Verificar límites del hábitat
  if (x < 0 || y < 0 || x + module.width > habitatWidth || y + module.height > habitatHeight) {
    return false;
  }

  // Verificar superposición con otros módulos
  for (const existingModule of existingModules) {
    if (
      x < existingModule.x + existingModule.width &&
      x + module.width > existingModule.x &&
      y < existingModule.y + existingModule.height &&
      y + module.height > existingModule.y
    ) {
      return false;
    }
  }

  return true;
};