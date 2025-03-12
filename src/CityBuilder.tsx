import { Grid } from '@react-three/drei';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import React, { useEffect, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { GameState, Position } from "./modules/types";
import { GameUI } from './components/GameUI';
import { RoadModule } from './modules/RoadModule';
import { useModuleStore } from './modules/ModuleManager';
import { PlacedModules } from './components/PlaceModules';

const CityBuilder: React.FC = () => {
  const { registerModule, placeModule, updateHoveredPosition } = useModuleStore();
  
  const [gameState, setGameState] = useState({
    money: 10000,
    population: 0,
    happiness: 50,
  });

  // Register modules on mount
  useEffect(() => {
    const roadModule = new RoadModule();
    registerModule(roadModule);
  }, []);

  // Handle grid interaction
  const handlePlaneClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const x = Math.floor(event.point.x);
    const z = Math.floor(event.point.z);
    
    // Only allow placement within grid bounds (0-20)
    if (x >= 0 && x < 20 && z >= 0 && z < 20) {
      placeModule({ x, z });
    }
  };

  const handlePlaneHover = (event: ThreeEvent<MouseEvent>) => {
    const x = Math.floor(event.point.x);
    const z = Math.floor(event.point.z);
    
    // Only show preview within grid bounds
    if (x >= 0 && x < 20 && z >= 0 && z < 20) {
      updateHoveredPosition({ x, z });
    } else {
      updateHoveredPosition(null);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
          <GameUI
      money={gameState.money}
      population={gameState.population}
      happiness={gameState.happiness}
    />
       <Canvas camera={{ position: [15, 15, 15], fov: 45 }} shadows>
        <color attach="background" args={["#87CEEB"]} />
        <OrbitControls 
          maxPolarAngle={Math.PI / 2.1}
          maxAzimuthAngle={Math.PI / 2}
          minAzimuthAngle={-Math.PI / 2}
        />
        
        {/* Align plane with grid */}
        <mesh 
          rotation-x={-Math.PI / 2}
          position={[10, 0, 10]}
          onPointerMove={handlePlaneHover}
          onPointerDown={handlePlaneClick}
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial visible={false} />
        </mesh>

        <Grid
          args={[20, 20]}
          position={[10, 0, 10]}
          cellSize={1}
          cellThickness={1}
          cellColor="#000"
          sectionSize={5}
          sectionThickness={2}
          sectionColor="#9f9f9f"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
        />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} castShadow />
        <PlacedModules />
      </Canvas>
    </div>
  );
};


export default CityBuilder;