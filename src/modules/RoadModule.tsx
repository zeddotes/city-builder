// src/modules/RoadModule.tsx
import React from 'react';
import { BaseModule, ModuleConfig } from './BaseModule';
import { Position } from './types';
import { Object3D, BoxGeometry, MeshStandardMaterial } from 'three';

export class RoadModule implements BaseModule {
  id = 'road';
  config: ModuleConfig = {
    cost: 100,
    maintenance: 5,
    buildTime: 0,
    category: 'infrastructure'
  };

  private placedRoads: Map<string, Object3D> = new Map();

  init(): void {}
  cleanup(): void {
    this.placedRoads.clear();
  }

  validate(position: Position): boolean {
    const key = `${position.x},${position.z}`;
    return !this.placedRoads.has(key);
  }

  place(position: Position): Object3D | null {
    if (!this.validate(position)) return null;
    
    const road = new Object3D();
    const key = `${position.x},${position.z}`;
    this.placedRoads.set(key, road);
    return road;
  }

  remove(position: Position): boolean {
    const key = `${position.x},${position.z}`;
    return this.placedRoads.delete(key);
  }

  getPreviewComponent(position: Position): React.FC {
    return () => (
      <mesh
        position={[position.x + 0.5, 0.05, position.z + 0.5]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[1, 0.1, 1]} />
        <meshStandardMaterial 
          color={this.validate(position) ? '#666666' : '#ff0000'} 
          transparent 
          opacity={0.5}
        />
      </mesh>
    );
  }

  onHover(position: Position | null): void {}

  getHappinessImpact(position: Position): number {
    return -5; // Roads slightly decrease happiness of nearby areas
  }

  getTrafficImpact(position: Position): number {
    return 1; // Roads increase traffic capacity
  }
}