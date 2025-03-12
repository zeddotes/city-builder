import * as THREE from 'three';
import { GameModule, GameState, Position } from './types';

export class ModuleManager {
  private modules: Map<string, GameModule> = new Map();
  private scene: THREE.Scene;
  private activeModuleId: string | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  registerModule(id: string, module: GameModule): void {
    this.modules.set(id, module);
    module.init(this.scene);
  }

  unregisterModule(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (module) {
      module.cleanup(this.scene);
      this.modules.delete(moduleId);
    }
  }

  setActiveModule(moduleId: string | null): void {
    console.log('Setting active module:', moduleId);
    const previousModule = this.getActiveModule();
    if (previousModule) {
      console.log('Previous module:', previousModule.id);
      const previewMesh = previousModule.getPreviewMesh?.();
      if (previewMesh) {
        previewMesh.visible = false;
      }
    }

    this.activeModuleId = moduleId;
    
    const newModule = this.getActiveModule();
    if (newModule) {
      console.log('New module:', newModule.id);
      const previewMesh = newModule.getPreviewMesh?.();
      if (previewMesh) {
        previewMesh.visible = true;
      }
    }
  }

  getActiveModule(): GameModule | null {
    return this.activeModuleId ? this.modules.get(this.activeModuleId) ?? null : null;
  }

  getAllModules(): GameModule[] {
    return Array.from(this.modules.values());
  }

  handleHover(position: Position | null): void {
    const activeModule = this.getActiveModule();
    if (activeModule) {
      activeModule.onHover?.(position);
    } else if (position === null) {
      // Hide preview meshes when no module is active
      this.modules.forEach(module => {
        const previewMesh = module.getPreviewMesh?.();
        if (previewMesh) {
          previewMesh.visible = false;
        }
      });
    }
  }

  handlePlace(position: Position): boolean {
    console.log('Handling place at position:', position);
    const activeModule = this.getActiveModule();
    if (!activeModule) {
      console.log('No active module');
      return false;
    }

    // Check if the position is valid for placement
    const isValid = activeModule.validate?.(position) ?? true;
    console.log('Position valid:', isValid);

    if (isValid) {
      const moduleObject = activeModule.place(position, this.scene);
      console.log('Module placed:', moduleObject ? 'success' : 'failed');
      
      if (moduleObject) {
        // Hide preview mesh temporarily after placement
        const previewMesh = activeModule.getPreviewMesh?.();
        if (previewMesh) {
          previewMesh.visible = false;
        }
        return true;
      }
    }
    return false;
  }

  handleTick(gameState: GameState): void {
    this.modules.forEach(module => {
      module.onTick?.(gameState);
    });
  }

  cleanup(): void {
    this.modules.forEach(module => module.cleanup(this.scene));
    this.modules.clear();
  }
}
