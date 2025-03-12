import * as THREE from 'three';
import { BaseModule } from './BaseModule';
import { ModuleObject, Position } from './types';

export class RoadModule extends BaseModule {
  private roadGeometry: THREE.BoxGeometry;
  private roadMaterial: THREE.MeshStandardMaterial;
  private previewMesh: THREE.Mesh | null = null;

  constructor() {
    super('road', {
      name: 'Road',
      description: 'Connect your city with roads',
      cost: 100,
      icon: '🛣️',
    });

    // Create geometries and materials
    this.roadGeometry = new THREE.BoxGeometry(1, 0.1, 1);
    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
    });
  }

  init(scene: THREE.Scene): void {
    console.log('Initializing RoadModule');
    
    // Create preview mesh with a separate material instance
    const previewMaterial = new THREE.MeshStandardMaterial({
      color: 0x33aa33,
      transparent: true,
      opacity: 0.5,
      roughness: 0.8,
      depthWrite: false, // Prevent z-fighting
    });

    this.previewMesh = new THREE.Mesh(
      this.roadGeometry,
      previewMaterial
    );
    
    // Position slightly above ground to prevent z-fighting
    this.previewMesh.position.y = 0.05;
    this.previewMesh.visible = false;
    
    scene.add(this.previewMesh);
    console.log('Preview mesh created and added to scene');
  }

  cleanup(scene: THREE.Scene): void {
    super.cleanup(scene);
    if (this.previewMesh) {
      scene.remove(this.previewMesh);
      this.previewMesh = null;
    }
  }

  place(position: Position, scene: THREE.Scene): ModuleObject | null {
    // Only place if position is valid
    if (!this.validate(position)) {
      return null;
    }

    const mesh = new THREE.Mesh(this.roadGeometry, this.roadMaterial.clone());
    mesh.position.set(position.x, 0.05, position.z);

    const roadObject: ModuleObject = {
      id: this.generateId(),
      type: 'road',
      position,
      mesh,
      cost: this.config.cost,
    };

    scene.add(mesh);
    this.objects.push(roadObject);
    this.updateRoadConnections();

    // Show preview mesh again after placement
    if (this.previewMesh) {
      this.previewMesh.visible = true;
    }

    return roadObject;
  }

  onHover(position: Position | null): void {
    console.log('Hovering at position:', position);
    if (!this.previewMesh) {
      console.log('No preview mesh available');
      return;
    }

    if (!position) {
      this.previewMesh.visible = false;
      return;
    }

    this.previewMesh.visible = true;
    this.previewMesh.position.set(position.x, 0.05, position.z);

    const isValid = this.validate(position);
    console.log('Position valid:', isValid);

    // Update preview color based on validity
    if (this.previewMesh.material instanceof THREE.MeshStandardMaterial) {
      this.previewMesh.material.color.setHex(
        isValid ? 0x33aa33 : 0xff3333
      );
    }
  }

  validate(position: Position): boolean {
    // Check if there's already a road at this position
    return !this.objects.some(
      obj => obj.position.x === position.x && obj.position.z === position.z
    );
  }

  getPreviewMesh(): THREE.Mesh | null {
    return this.previewMesh;
  }

  private updateRoadConnections(): void {
    // In a more advanced implementation, this method would update the road textures
    // based on neighboring roads to create proper connections
  }
}
