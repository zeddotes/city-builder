import { Object3D } from 'three';
import { Position } from './types';

export interface ModuleConfig {
  cost: number;
  maintenance: number;
  buildTime: number;
  category: 'infrastructure' | 'residential' | 'commercial' | 'industrial' | 'utility';
}

export interface BaseModule {
  id: string;
  config: ModuleConfig;
  
  // Core methods
  init(): void;
  cleanup(): void;
  
  // Placement methods
  validate(position: Position): boolean;
  place(position: Position): Object3D | null;
  remove(position: Position): boolean;
  
  // Preview/UI methods
  getPreviewComponent(position: Position): React.FC;
  onHover(position: Position | null): void;
  
  // Game mechanics
  updateSimulation?(deltaTime: number): void;
  getHappinessImpact?(position: Position): number;
  getPollutionImpact?(position: Position): number;
  getTrafficImpact?(position: Position): number;
}