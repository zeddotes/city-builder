import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ModuleManager } from "./modules/ModuleManager";
import { RoadModule } from "./modules/RoadModule";
import { GameState, Position } from "./modules/types";

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
  
  // Three.js objects
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  // Module system
  const moduleManagerRef = useRef<ModuleManager | null>(null);
  
  // Mouse position tracking
  const [mouseGridPosition, setMouseGridPosition] = useState<Position | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    console.log("Initializing Three.js scene");

    // Set scene background
    sceneRef.current.background = new THREE.Color("#87CEEB"); // Sky blue background

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45, // Lower FOV for better perspective
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(15, 15, 15); // Better initial position
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Clean up any existing canvases
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true, // Enable transparency
      powerPreference: 'high-performance' // Optimize for performance
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Handle high DPI displays
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1; // Smoother damping
    controls.minDistance = 10;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2.2; // Stricter angle limit
    controls.target.set(0, 0, 0); // Ensure we're looking at the center
    controlsRef.current = controls;

    // Create grid
    const gridSize = 40;
    const cellSize = 1;
    const grid = new THREE.GridHelper(gridSize, gridSize, 0x000000, 0x888888);
    grid.position.y = 0.01; // Slightly above ground to prevent z-fighting
    sceneRef.current.add(grid);
    gridRef.current = grid;

    // Add ground plane with improved material
    const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize, 200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a9c2d, // Darker grass green
      side: THREE.DoubleSide,
      roughness: 1.0, // More matte appearance
      metalness: 0.0, // No metallic properties
      flatShading: true, // Enable flat shading for a more stylized look
    });
    
    // Add subtle vertex displacement for terrain variation
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const noise = Math.random() * 0.05;
      vertices[i + 1] = noise; // Y coordinate
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0; // At y=0 for proper raycasting
    ground.receiveShadow = true;
    sceneRef.current.add(ground);

    // Initialize module manager
    const moduleManager = new ModuleManager(sceneRef.current);
    moduleManagerRef.current = moduleManager;
    
    // Create and register road module
    const roadModule = new RoadModule();
    moduleManager.registerModule("road", roadModule);
    
    console.log("Modules registered:", moduleManager.getAllModules().map(m => m.id));

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    sceneRef.current.add(ambientLight);

    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    
    sceneRef.current.add(directionalLight);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(sceneRef.current, camera);
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

    // Cleanup
    return () => {
      console.log("Cleaning up CityBuilder");
      
      // Cancel animation frame
      cancelAnimationFrame(animationFrameId);
      
      // Remove event listeners
      window.removeEventListener("resize", handleResize);
      
      // Clean up module manager
      if (moduleManagerRef.current) {
        moduleManagerRef.current.cleanup();
        moduleManagerRef.current = null;
      }
      
      // Clean up renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        if (mountRef.current?.contains(rendererRef.current.domElement)) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
      
      // Clean up controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      
      // Clean up camera
      cameraRef.current = null;
      
      // Clean up scene
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
      sceneRef.current = new THREE.Scene();
      
      // Remove any remaining canvases
      while (mountRef.current?.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
    };
  }, []);

  // Function to get grid position from mouse event
  const getGridPositionFromMouse = (event: MouseEvent): Position | null => {
    if (!cameraRef.current || !rendererRef.current) return null;

    const canvas = rendererRef.current.domElement;
    const rect = canvas.getBoundingClientRect();

    // Only handle events on the canvas
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      return null;
    }

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Get intersection with ground plane
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();

    if (!raycasterRef.current.ray.intersectPlane(groundPlane, intersection)) {
      return null;
    }

    // Round to grid
    return {
      x: Math.round(intersection.x),
      z: Math.round(intersection.z),
    };
  };

  // Handle mouse movement for module hovering
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!mountRef.current || !cameraRef.current || !renderer) return;

    const canvas = renderer.domElement;
    
    const handleMouseMove = (event: MouseEvent) => {
      console.log(">>>", event)
      const position = getGridPositionFromMouse(event);
      setMouseGridPosition(position);
      
      // Update module hover
      if (moduleManagerRef.current) {
        moduleManagerRef.current.handleHover(position);
      }
    };

    const handleMouseLeave = () => {
      setMouseGridPosition(null);
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

  // Handle click events for module placement
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!mountRef.current || !cameraRef.current || !renderer) return;

    const canvas = renderer.domElement;
    
    const handleClick = async (event: MouseEvent) => {
      console.log("Click event triggered");
      
      // Get grid position from mouse
      const position = getGridPositionFromMouse(event);
      if (!position) {
        console.log("No valid grid position");
        return;
      }
      
      console.log("Click position:", position);
      
      // Only try to place if we have a module manager
      if (!moduleManagerRef.current) {
        console.log("Module manager not initialized");
        return;
      }
      
      // Get the active module
      const activeModule = moduleManagerRef.current.getActiveModule();
      if (!activeModule) {
        console.log("No active module selected");
        return;
      }
      
      console.log("Attempting to place module:", activeModule.id);
      
      // Check if position is valid
      const isValid = activeModule.validate ? activeModule.validate(position) : true;
      if (!isValid) {
        console.log("Invalid position for placement");
        return;
      }
      
      // Place the module
      if (!sceneRef.current) {
        console.log("Scene not initialized");
        return;
      }

      // Try to place the module using the module manager
      try {
        const success = moduleManagerRef.current.handlePlace(position);
        console.log("Place attempt result:", success);

        if (success) {
          console.log("Successfully placed module at position:", position);
          
          // Update game state
          setGameState(prevState => ({
            ...prevState,
            money: prevState.money - activeModule.config.cost
          }));
          
          // Make sure preview is still visible for next placement
          moduleManagerRef.current.handleHover(position);
          
          // Force a re-render to update the scene
          rendererRef.current?.render(sceneRef.current, cameraRef.current!);
        } else {
          console.log("Failed to place module");
        }
      } catch (error) {
        console.error("Error placing module:", error);
      }
    };

    canvas.addEventListener("click", handleClick);
    
    return () => {
      canvas.removeEventListener("click", handleClick);
    };
  }, []);

  // Handle module selection
  const handleModuleSelect = (moduleId: string | null) => {
    console.log("Selecting module:", moduleId, "current:", activeModuleId);
    
    // Toggle module off if it's already active
    const newModuleId = moduleId === activeModuleId ? null : moduleId;
    
    // Update state
    setActiveModuleId(newModuleId);
    
    // Update module manager
    if (moduleManagerRef.current) {
      // Set the active module in the module manager
      moduleManagerRef.current.setActiveModule(newModuleId);
      console.log("newModuleId", newModuleId)
      console.log(">mouseGridPosition", mouseGridPosition)
      // If we have a current mouse position, update the hover
      if (mouseGridPosition) {
        console.log("Updating hover for new module at:", mouseGridPosition);
        moduleManagerRef.current.handleHover(mouseGridPosition);
      } else {
        console.log("No current mouse position for hover");
        moduleManagerRef.current.handleHover(null);
      }
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
      <div className="ui-overlay">
        {/* Game Stats */}
        <div className="stats-panel">
          <div className="stat-item">
            <span className="stat-icon">💰</span>
            <span className="stat-value">${gameState.money.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">👥</span>
            <span className="stat-value">{gameState.population.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">😊</span>
            <span className="stat-value">{gameState.happiness}%</span>
          </div>
        </div>
        
        {/* Grid Position */}
        {mouseGridPosition && (
          <div className="grid-position">
            <span className="grid-icon">📍</span>
            <span className="grid-coords">({mouseGridPosition.x}, {mouseGridPosition.z})</span>
          </div>
        )}
      </div>

      {/* Module Selection Panel */}
      <div
        className="module-panel"
        style={{

          display: "flex",
          justifyContent: "center",
          padding: "1rem",
          gap: "1rem",
          backgroundColor: "rgba(0,0,0,0.7)",
        }}
      >
        <button
          onClick={() => handleModuleSelect("road")}
          className={`module-button ${activeModuleId === "road" ? "active" : ""}`}
        >
          🛣️ Road (100$)
        </button>
      </div>
    </div>
  );
};

export default CityBuilder;
