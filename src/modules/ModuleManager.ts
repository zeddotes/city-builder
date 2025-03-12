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
    console.log(`Registering module: ${id}`);
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
    console.log(`Setting active module: ${moduleId}`);
    
    // Deactivate current module
    const previousModule = this.getActiveModule();
    if (previousModule) {
      console.log(`Deactivating previous module: ${previousModule.id}`);
      if (previousModule.onHover) {
        previousModule.onHover(null);
      }
    }

    // Update active module ID
    this.activeModuleId = moduleId;
    
    // Activate new module
    const newModule = this.getActiveModule();
    if (newModule) {
      console.log(`Activated new module: ${newModule.id}`);
    }
  }

  getActiveModule(): GameModule | null {
    if (!this.activeModuleId) return null;
    
    const module = this.modules.get(this.activeModuleId) || null;
    console.log(`Getting active module: ${this.activeModuleId}, exists: ${!!module}`);
    return module;
  }
  
  getModuleById(moduleId: string): GameModule | null {
    const module = this.modules.get(moduleId) || null;
    console.log(`Getting module by ID: ${moduleId}, exists: ${!!module}`);
    return module;
  }

  getAllModules(): GameModule[] {
    return Array.from(this.modules.values());
  }

  handleHover(position: Position | null): void {
    const activeModule = this.getActiveModule();
    if (activeModule && activeModule.onHover) {
      activeModule.onHover(position);
    }
  }

  handlePlace(position: Position): boolean {
    console.log(`Handling place at position: (${position.x}, ${position.z})`);
    
    const activeModule = this.getActiveModule();
    if (!activeModule) {
      console.log('No active module');
      return false;
    }

    // Check if the position is valid for placement
    const isValid = activeModule.validate ? activeModule.validate(position) : true;
    console.log(`Position valid: ${isValid}`);

    if (isValid) {
      // Log current scene state
      console.log('Scene state before placement:', {
        children: this.scene.children.length,
        activeModuleId: this.activeModuleId,
        position
      });

      // Attempt to place the module
      const moduleObject = activeModule.place(position, this.scene);
      
      // Log placement result
      console.log('Placement result:', {
        success: !!moduleObject,
        newChildren: this.scene.children.length,
        moduleObjects: activeModule.objects.length
      });
      
      if (moduleObject) {
        // Ensure the mesh was actually added to the scene
        if (!this.scene.children.includes(moduleObject.mesh)) {
          console.error('Mesh not found in scene after placement');
          this.scene.add(moduleObject.mesh);
        }
        return true;
      }
    }
    
    return false;
  }

  handleTick(gameState: GameState): void {
    this.modules.forEach(module => {
      if (module.onTick) {
        module.onTick(gameState);
      }
    });
  }

  cleanup(): void {
    console.log('Cleaning up ModuleManager');
    this.modules.forEach(module => module.cleanup(this.scene));
    this.modules.clear();
  }
}
