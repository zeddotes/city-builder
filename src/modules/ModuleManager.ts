import { BaseModule } from './BaseModule';
import { Position } from './types';
import {create} from 'zustand';

interface ModuleState {
  modules: Map<string, BaseModule>;
  activeModuleId: string | null;
  placedModules: Map<string, BaseModule>;
  hoveredPosition: Position | null;
  
  registerModule: (module: BaseModule) => void;
  setActiveModule: (moduleId: string | null) => void;
  placeModule: (position: Position) => boolean;
  removeModule: (position: Position) => boolean;
  updateHoveredPosition: (position: Position | null) => void;
}


export const useModuleStore = create<ModuleState>((set, get) => ({
  modules: new Map(),
  activeModuleId: null,
  placedModules: new Map(),
  hoveredPosition: null,

  registerModule: (module: BaseModule) => {
    set(state => {
      const modules = new Map(state.modules);
      modules.set(module.id, module);
      module.init();
      return { modules };
    });
  },

  setActiveModule: (moduleId: string | null) => {
    set({ activeModuleId: moduleId });
  },

  placeModule: (position: Position) => {
    const { modules, activeModuleId, placedModules } = get();
    if (!activeModuleId) return false;

    const module = modules.get(activeModuleId);
    if (!module || !module.validate(position)) return false;

    const object = module.place(position);
    if (!object) return false;

    const key = `${position.x},${position.z}`;
    set(state => ({
      placedModules: new Map(state.placedModules).set(key, module)
    }));
    return true;
  },

  removeModule: (position: Position) => {
    const key = `${position.x},${position.z}`;
    const { placedModules } = get();
    const module = placedModules.get(key);
    
    if (!module) return false;
    
    const success = module.remove(position);
    if (success) {
      set(state => {
        const newPlacedModules = new Map(state.placedModules);
        newPlacedModules.delete(key);
        return { placedModules: newPlacedModules };
      });
    }
    return success;
  },

  updateHoveredPosition: (position: Position | null) => {
    const { activeModuleId, modules } = get();
    if (activeModuleId) {
      const module = modules.get(activeModuleId);
      module?.onHover(position);
    }
    set({ hoveredPosition: position });
  }
}));