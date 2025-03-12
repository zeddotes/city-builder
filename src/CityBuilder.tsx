import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ModuleManager } from "./modules/ModuleManager";
import { RoadModule } from "./modules/RoadModule";
import { GameState } from "./modules/types";

const CityBuilder: React.FC = () => {
  // DOM references
  const mountRef = useRef<HTMLDivElement>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    money: 10000,
    population: 0,
    happiness: 50,
  });

  // Active module state
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  
  // Module system
  const moduleManagerRef = useRef<ModuleManager | null>(null);

  // Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const hoveredCellRef = useRef<THREE.Mesh | null>(null);



  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#87CEEB"); // Sky blue background
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2.1; // Limit rotation to prevent going below ground
    controlsRef.current = controls;

    // Create grid
    const gridSize = 40;
    const cellSize = 1;
    const grid = new THREE.GridHelper(gridSize, gridSize, 0x000000, 0x888888);
    scene.add(grid);
    gridRef.current = grid;

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x228b22, // Forest green
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -0.01; // Slightly below grid to prevent z-fighting
    scene.add(ground);

    // Initialize module manager
    const moduleManager = new ModuleManager(scene);
    const roadModule = new RoadModule();
    moduleManager.registerModule("road", roadModule);
    moduleManagerRef.current = moduleManager;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Create transparent cube for cell hovering
    const cellGeometry = new THREE.BoxGeometry(cellSize, 0.1, cellSize);
    const cellMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.5,
    });
    const hoveredCell = new THREE.Mesh(cellGeometry, cellMaterial);
    hoveredCell.visible = false;
    scene.add(hoveredCell);
    hoveredCellRef.current = hoveredCell;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Handle click events
    const handleClick = (event: MouseEvent) => {
      console.log('Click event triggered');
      if (!moduleManagerRef.current || !cameraRef.current || !rendererRef.current) {
        console.log('Missing required refs');
        return;
      }

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      if (!rect) {
        console.log('No bounding rect');
        return;
      }

      // Only handle clicks on the canvas
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) {
        console.log('Click outside canvas');
        return;
      }

      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Get intersection point
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      if (!raycasterRef.current.ray.intersectPlane(groundPlane, intersection)) {
        console.log('No intersection with ground plane');
        return;
      }

      // Round to grid
      const position = {
        x: Math.round(intersection.x),
        z: Math.round(intersection.z),
      };
      console.log('Click position:', position);

      // Only try to place if we have an active module
      const activeModule = moduleManagerRef.current.getActiveModule();
      console.log('Active module:', activeModule?.id);
      
      if (activeModule && moduleManagerRef.current.handlePlace(position)) {
        console.log('Placing module at position:', position);
        // Update game state after successful placement
        setGameState(prevState => ({
          ...prevState,
          money: prevState.money - activeModule.config.cost
        }));
      } else {
        console.log('Failed to place module');
      }
    };

    const canvas = rendererRef.current.domElement;
    canvas.addEventListener("click", handleClick);

    // Cleanup
    return () => {
      console.log('Cleaning up CityBuilder');
      window.removeEventListener("resize", handleResize);
      
      const canvas = rendererRef.current?.domElement;
      if (canvas) {
        canvas.removeEventListener("click", handleClick);
      }

      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }

      // Clean up module manager and preview meshes
      if (moduleManagerRef.current) {
        moduleManagerRef.current.cleanup();
        moduleManagerRef.current.setActiveModule(null);
      }

      if (sceneRef.current) {
        // Dispose geometries and materials
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();

            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            } else if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            }
          }
        });
      }
    };
  }, []);

  // Handle mouse movement for module hovering
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!mountRef.current || !sceneRef.current || !cameraRef.current || !renderer) return;

    const canvas = renderer.domElement;
    const handleMouseMove = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates (-1 to +1)
      const rect = canvas.getBoundingClientRect();

      // Only handle mouse move if it's over the canvas
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) {
        if (moduleManagerRef.current) {
          moduleManagerRef.current.handleHover(null);
        }
        return;
      }

      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update module hover
      if (moduleManagerRef.current && cameraRef.current) {
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        
        if (raycasterRef.current.ray.intersectPlane(groundPlane, intersection)) {
          const position = {
            x: Math.round(intersection.x),
            z: Math.round(intersection.z),
          };

          console.log('Mouse move position:', position);
          moduleManagerRef.current.handleHover(position);
        } else {
          moduleManagerRef.current.handleHover(null);
        }
      }
    };

    const handleMouseLeave = () => {
      if (moduleManagerRef.current) {
        moduleManagerRef.current.handleHover(null);
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Handle module selection
  const handleModuleSelect = (moduleId: string | null) => {
    console.log('Selecting module:', moduleId, 'current:', activeModuleId);
    setActiveModuleId(moduleId);
    if (moduleManagerRef.current) {
      moduleManagerRef.current.setActiveModule(moduleId);
    }
  };

  return (
    <div className="city-builder">
      <div
        ref={mountRef}
        className="city-builder-canvas"
        style={{ width: "100vw", height: "100vh" }}
      />

      {/* UI Overlay */}
      <div
        className="ui-overlay"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          padding: "1rem",
          color: "white",
          textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
        }}
      >
        <div className="resources" style={{ display: "flex", gap: "1rem" }}>
          <div>Money: ${gameState.money}</div>
          <div>Population: {gameState.population}</div>
          <div>Happiness: {gameState.happiness}%</div>
        </div>
      </div>

      {/* Module Selection Panel */}
      <div
        className="module-panel"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          padding: "1rem",
          gap: "1rem",
          backgroundColor: "rgba(0,0,0,0.7)",
        }}
      >
        <button
          onClick={() => handleModuleSelect(activeModuleId === "road" ? null : "road")}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: activeModuleId === "road" ? "#333333" : "#fff",
            color: activeModuleId === "road" ? "#fff" : "#000",
            border: "2px solid",
            borderColor: activeModuleId === "road" ? "#555" : "#ddd",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: activeModuleId === "road" ? "bold" : "normal",
          }}
        >
          🛣️ Road (100$)
        </button>
      </div>
    </div>
  );
};

export default CityBuilder;
