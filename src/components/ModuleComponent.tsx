// src/components/ModuleComponent.tsx
import { useFrame } from '@react-three/fiber';
import React from 'react';
import { BaseModule } from '../modules/BaseModule';
import { Position } from '../modules/types';

interface ModuleComponentProps {
  module: BaseModule;
  position: Position;
  isPreview?: boolean;
}

export const ModuleComponent: React.FC<ModuleComponentProps> = ({ 
  module, 
  position, 
  isPreview = false 
}) => {
  useFrame((_, delta) => {
    if (module.updateSimulation) {
      module.updateSimulation(delta);
    }
  });

  const PreviewComponent = module.getPreviewComponent(position);
  return <PreviewComponent />;
};