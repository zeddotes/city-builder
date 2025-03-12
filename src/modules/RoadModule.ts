import * as THREE from 'three';
import { BaseModule } from './BaseModule';
import { ModuleObject, Position } from './types';

export class RoadModule extends BaseModule {
  private roadGeometry: THREE.BufferGeometry;
  private roadMaterial: THREE.MeshStandardMaterial;
  private previewMesh: THREE.Mesh | null = null;

  constructor() {
    super('road', {
      name: 'Road',
      description: 'Connect your city with roads',
      cost: 100,
      icon: '🛣️',
    });

    // Create road geometry to exactly fill a grid cell
    const geometry = new THREE.BoxGeometry(1, 0.1, 1);
    
    // Create material with improved appearance
    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.9,
      metalness: 0.1,
      envMapIntensity: 0.5,
      side: THREE.DoubleSide, // Ensure both sides are visible
    });
    
    // Center the geometry in its local space
    geometry.translate(0.5, 0.05, 0.5);
    
    this.roadGeometry = geometry;
  }

  init(scene: THREE.Scene): void {
    console.log('Initializing RoadModule');
    
    // Create preview mesh with a separate material instance
    const previewMaterial = new THREE.MeshStandardMaterial({
      color: 0x33aa33,
      transparent: true,
      opacity: 0.7,
      roughness: 0.6,
      metalness: 0.3,
      depthWrite: true,
      emissive: 0x225522,
      emissiveIntensity: 0.3,
      // Enable blending for smoother transparency
      blending: THREE.NormalBlending,
      // Ensure transparent objects render in the correct order
      depthTest: true,
      side: THREE.DoubleSide,
    });

    // Create preview mesh using the same geometry as the road
    const previewGeometry = this.roadGeometry.clone();
    this.previewMesh = new THREE.Mesh(previewGeometry, previewMaterial);
    
    // Position at origin (geometry is pre-centered)
    this.previewMesh.position.set(0, 0, 0);
    
    // Log preview setup
    console.log('Preview mesh initialized:', {
      position: this.previewMesh.position.toArray(),
      rotation: this.previewMesh.rotation.toArray(),
      visible: this.previewMesh.visible
    });
    this.previewMesh.visible = false;
    
    // Enable shadows
    this.previewMesh.castShadow = true;
    this.previewMesh.receiveShadow = true;
    
    // Add the preview mesh to the scene
    scene.add(this.previewMesh);
    console.log('Preview mesh created and added to scene for RoadModule');
    
    // Log initial state
    console.log('RoadModule initialized:', {
      geometryType: this.roadGeometry.type,
      materialColor: this.roadMaterial.color.getHexString(),
      previewExists: !!this.previewMesh,
      sceneChildren: scene.children.length,
      previewPosition: this.previewMesh.position.toArray(),
      previewRotation: this.previewMesh.rotation.toArray()
    });
  }

  cleanup(scene: THREE.Scene): void {
    super.cleanup(scene);
    if (this.previewMesh) {
      scene.remove(this.previewMesh);
      this.previewMesh.geometry.dispose();
      if (this.previewMesh.material instanceof THREE.Material) {
        this.previewMesh.material.dispose();
      }
      this.previewMesh = null;
    }
  }

  place(position: Position, scene: THREE.Scene): ModuleObject | null {
    console.log('Attempting to place road at position:', position);
    
    // Only place if position is valid
    if (!this.validate(position)) {
      console.log('Invalid position for road placement');
      return null;
    }

    try {
      // Create a new mesh for the road
      const mesh = new THREE.Mesh(this.roadGeometry.clone(), this.roadMaterial.clone());
      
      // Position at grid coordinates (geometry is pre-centered)
      mesh.position.set(position.x, 0, position.z);
      
      // Log placement for debugging
      console.log('Road placed at:', {
        gridPosition: position,
        meshPosition: mesh.position.toArray(),
        meshRotation: mesh.rotation.toArray(),
        meshScale: mesh.scale.toArray()
      });
      
      // Enable shadows
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const roadObject: ModuleObject = {
        id: this.generateId(),
        type: 'road',
        position,
        mesh,
        cost: this.config.cost,
      };

      // Add to scene and track the object
      scene.add(mesh);
      this.objects.push(roadObject);
      
      // Update road connections
      this.updateRoadConnections();
      
      // Log placement details
      console.log('Road placement details:', {
        position: mesh.position.toArray(),
        rotation: mesh.rotation.toArray(),
        inScene: scene.children.includes(mesh),
        objectsCount: this.objects.length
      });

      return roadObject;
    } catch (error) {
      console.error('Error placing road:', error);
      return null;
    }
  }

  onHover(position: Position | null): void {
    if (!this.previewMesh) {
      console.log('No preview mesh available');
      return;
    }

    if (!position) {
      this.previewMesh.visible = false;
      return;
    }

    // Update preview mesh position and visibility
    this.previewMesh.visible = true;
    this.previewMesh.position.set(position.x, 0, position.z);

    // Check if position is valid for placement
    const isValid = this.validate(position);

    // Update preview appearance based on validity
    if (this.previewMesh.material instanceof THREE.MeshStandardMaterial) {
      // Set color (green for valid, red for invalid)
      this.previewMesh.material.color.setHex(
        isValid ? 0x33aa33 : 0xff3333
      );
      
      // Adjust opacity based on validity
      this.previewMesh.material.opacity = isValid ? 0.7 : 0.5;
      
      // Add emissive glow for better visibility
      this.previewMesh.material.emissive.setHex(
        isValid ? 0x225522 : 0x552222
      );
      this.previewMesh.material.emissiveIntensity = 0.3;
    }
    
    // Log hover state
    console.log('Road hover state:', {
      position: this.previewMesh.position.toArray(),
      rotation: this.previewMesh.rotation.toArray(),
      isValid,
      visible: this.previewMesh.visible
    });
  }

  validate(position: Position): boolean {
    // Check if there's already a road at this position
    const existingRoad = this.objects.some(
      obj => obj.position.x === position.x && obj.position.z === position.z
    );
    
    return !existingRoad;
  }

  getPreviewMesh(): THREE.Mesh | null {
    console.log('Getting preview mesh for RoadModule, exists:', !!this.previewMesh);
    return this.previewMesh;
  }

  private updateRoadConnections(): void {
    // In a more advanced implementation, this method would update the road textures
    // based on neighboring roads to create proper connections
  }
}
