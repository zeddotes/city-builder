import * as THREE from 'three';

export interface Position {
  x: number;
  z: number;
}

export interface GameState {
  money: number;
  population: number;
  happiness: number;
}

export interface ModuleObject {
  id: string;
  type: string;
  position: Position;
  mesh: THREE.Mesh;
  cost: number;
}

export interface ModuleConfig {
  name: string;
  description: string;
  cost: number;
  icon?: string;
  supportsDrag?: boolean; // Whether this module type supports drag placement
}

export interface GameModule {
  id: string;
  config: ModuleConfig;
  objects: ModuleObject[];
  
  // Module lifecycle
  init(scene: THREE.Scene): void;
  cleanup(scene: THREE.Scene): void;
  
  // Core functionality
  place(position: Position, scene: THREE.Scene): ModuleObject | null;
  remove(objectId: string, scene: THREE.Scene): void;
  
  // Optional hooks
  onTick?(state: GameState): void;
  onHover?(position: Position | null): void;
  validate?(position: Position): boolean;
  getPreviewMesh?(): THREE.Mesh | null;
  
  // Drag support
  onDragStart?(position: Position): void;
  onDragMove?(position: Position): void;
  onDragEnd?(position: Position): void;
}
