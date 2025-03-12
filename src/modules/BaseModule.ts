import * as THREE from 'three';
import { GameModule, ModuleConfig, ModuleObject, Position, GameState } from './types';

export abstract class BaseModule implements GameModule {
  id: string;
  config: ModuleConfig;
  objects: ModuleObject[] = [];

  constructor(id: string, config: ModuleConfig) {
    this.id = id;
    this.config = config;
  }

  init(scene: THREE.Scene): void {}
  cleanup(scene: THREE.Scene): void {
    this.objects.forEach(obj => {
      scene.remove(obj.mesh);
      obj.mesh.geometry.dispose();
      if (Array.isArray(obj.mesh.material)) {
        obj.mesh.material.forEach(m => m.dispose());
      } else {
        obj.mesh.material.dispose();
      }
    });
    this.objects = [];
  }

  abstract place(position: Position, scene: THREE.Scene): ModuleObject | null;
  
  remove(objectId: string, scene: THREE.Scene): void {
    const objIndex = this.objects.findIndex(obj => obj.id === objectId);
    if (objIndex === -1) return;

    const obj = this.objects[objIndex];
    scene.remove(obj.mesh);
    obj.mesh.geometry.dispose();
    if (Array.isArray(obj.mesh.material)) {
      obj.mesh.material.forEach(m => m.dispose());
    } else {
      obj.mesh.material.dispose();
    }
    
    this.objects.splice(objIndex, 1);
  }

  protected generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
