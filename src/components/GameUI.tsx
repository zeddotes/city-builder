// src/components/GameUI.tsx
import React from 'react';
import { useModuleStore } from '../modules/ModuleManager';
import styles from './GameUI.module.css';

interface GameUIProps {
  money: number;
  population: number;
  happiness: number;
}

export const GameUI: React.FC<GameUIProps> = ({ money, population, happiness }) => {
    const { activeModuleId, setActiveModule } = useModuleStore();
  
    return (
      <div className={styles.uiContainer}>
        <div className={styles.stats}>
          <div>💰 ${money.toLocaleString()}</div>
          <div>👥 {population.toLocaleString()}</div>
          <div>😊 {happiness}%</div>
        </div>
        <div className={styles.toolbar}>
          <button 
            onClick={() => setActiveModule(activeModuleId === 'road' ? null : 'road')}
            className={`${styles.toolButton} ${activeModuleId === 'road' ? styles.active : ''}`}
          >
            🛣️ Road
          </button>
        </div>
      </div>
    );
};