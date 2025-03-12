// src/components/PlacedModules.tsx
import { useModuleStore } from '../modules/ModuleManager';
import { ModuleComponent } from './ModuleComponent';

export const PlacedModules = () => {
  const { placedModules } = useModuleStore();
  
  return (
    <>
      {Array.from(placedModules.entries()).map(([key, module]) => {
        const [x, z] = key.split(',').map(Number);
        return (
          <ModuleComponent
            key={key}
            module={module}
            position={{ x, z }}
          />
        );
      })}
    </>
  );
};