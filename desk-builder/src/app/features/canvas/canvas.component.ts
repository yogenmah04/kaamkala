import { Component, ElementRef, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeskConfigService } from '../../core/services/desk-config.service';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-800">3. Interactive 360° 3D Layout Canvas</h2>
        <button (click)="deskConfig.toggleDeskState()"
                class="px-5 py-2 font-bold rounded shadow-md transition-colors"
                [ngClass]="(deskConfig.state$ | async)?.isDeskOpen ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-green-100 text-green-700 hover:bg-green-200'">
          {{ (deskConfig.state$ | async)?.isDeskOpen ? 'Close Desk' : 'Open Desk' }}
        </button>
      </div>
      
      <div class="w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden relative cursor-move" #threeCanvas>
        <!-- The Three.js canvas will be injected here -->
        <div class="absolute bottom-4 left-4 text-xs font-bold text-gray-500 bg-white/80 p-2 rounded shadow pointer-events-none z-10">
          <p>Drag to Rotate 360° | Scroll to Zoom</p>
        </div>
      </div>

      <div class="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 flex flex-col shadow-inner">
        <p class="font-bold mb-2">Notice: 360° 3D Mode Activated</p>
        <p class="text-sm">We have successfully migrated the rendering engine to WebGL using Three.js to provide a true 360-degree orbital view of your desk!</p>
        <p class="text-sm mt-2 text-gray-600">Note: 2D Drag-and-Drop mechanics are currently disabled in this preview while we build the 3D raycasting system.</p>
      </div>
    </div>
  `,
  styles: []
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('threeCanvas') canvasRef!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  
  private deskGroup!: THREE.Group;
  private foldPanel!: THREE.Mesh;
  private dragControls!: DragControls;
  private draggableObjects: THREE.Mesh[] = [];

  private animationFrameId: number | null = null;
  private subscription: any;

  constructor(public deskConfig: DeskConfigService) {}

  ngAfterViewInit() {
    this.initThreeJs();
    
    this.subscription = this.deskConfig.state$.subscribe(state => {
      this.updateDeskModel(state);
    });
  }

  ngOnDestroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.subscription) this.subscription.unsubscribe();
    if (this.renderer) {
      this.renderer.dispose();
      const canvasContainer = this.canvasRef.nativeElement;
      while (canvasContainer.firstChild) {
        canvasContainer.removeChild(canvasContainer.firstChild);
      }
    }
  }

  private initThreeJs() {
    const container = this.canvasRef.nativeElement;
    
    // Setup Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf3f4f6); // Light gray background
    
    // Add grid floor
    const gridHelper = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    gridHelper.position.y = -400; // Place below desk
    this.scene.add(gridHelper);

    // Setup Camera
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 5000);
    this.camera.position.set(0, 200, 1500);

    // Setup Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 500, 300);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Setup Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Setup Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 500;
    this.controls.maxDistance = 3000;

    // Create Desk Group
    this.deskGroup = new THREE.Group();
    this.scene.add(this.deskGroup);

    this.animate();
    
    // Handle resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private updateDeskModel(state: any) {
    // Clear previous geometry
    while(this.deskGroup.children.length > 0){ 
      this.deskGroup.remove(this.deskGroup.children[0]); 
    }

    const { width, height, depth } = state.dimensions;
    const thickness = 20; // 20mm wood thickness

    // Materials
    // Use the dynamic custom color hex directly from the state
    const cabinetColor = new THREE.Color(state.cabinetColorHex || 0x222222);
    const panelColor = new THREE.Color(state.panelColorHex || 0x5c4033);

    const cabinetMat = new THREE.MeshStandardMaterial({ color: cabinetColor, roughness: 0.8 });
    const panelMat = new THREE.MeshStandardMaterial({ color: panelColor, roughness: 0.5 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2 });
    const ledMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 1 });

    // Back Panel
    const backGeo = new THREE.BoxGeometry(width, height, thickness);
    const backMesh = new THREE.Mesh(backGeo, panelMat);
    backMesh.position.z = -depth/2 + thickness/2;
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    this.deskGroup.add(backMesh);

    // Render Configured Items (Monitors, Shelves, LEDs)
    this.draggableObjects = [];
    
    if (state.isDeskOpen && state.items) {
      state.items.forEach((item: any) => {
        // Map 2D pixel coordinates back to mm (scale was 0.75 in 2D)
        const realW = (item.width || 256) / 0.75;
        const realH = (item.height || 160) / 0.75;
        
        // 2D Origin (0,0) is top-left. 3D Origin is center.
        const pxX = item.x / 0.75;
        const pxY = item.y / 0.75;
        
        const x3D = pxX - width/2 + realW/2;
        const y3D = height/2 - pxY - realH/2;
        const z3D = -depth/2 + thickness + 10; // offset slightly from back panel
        
        let itemMesh: THREE.Mesh;
        
        if (item.type === 'monitor') {
          // Monitor base
          const monGeo = new THREE.BoxGeometry(realW, realH, 20);
          itemMesh = new THREE.Mesh(monGeo, blackMat);
        } else if (item.type.includes('shelf')) {
          // Wood Partition (Custom L x H x B)
          const realD = (item.itemDepth || 150) / 0.75; 
          const shelfGeo = new THREE.BoxGeometry(realW, realH, realD);
          itemMesh = new THREE.Mesh(shelfGeo, cabinetMat);
          itemMesh.position.z += realD / 2; // Adjust origin so it sits flush on the back wall
        } else if (item.type.includes('accessory')) {
          // LED Strip (Custom L x H x B)
          const realD = (item.itemDepth || 10) / 0.75; 
          const ledGeo = new THREE.BoxGeometry(realW, realH, realD);
          itemMesh = new THREE.Mesh(ledGeo, ledMat);
          itemMesh.position.z += realD / 2;
        } else {
          const defaultGeo = new THREE.BoxGeometry(realW, realH, 20);
          itemMesh = new THREE.Mesh(defaultGeo, panelMat);
        }
        
        itemMesh.position.set(x3D, y3D, z3D);
        itemMesh.userData = { id: item.id };
        itemMesh.castShadow = true;
        this.deskGroup.add(itemMesh);
        this.draggableObjects.push(itemMesh);
      });
    }

    // Top Panel
    const topGeo = new THREE.BoxGeometry(width, thickness, depth);
    const topMesh = new THREE.Mesh(topGeo, cabinetMat);
    topMesh.position.y = height/2 - thickness/2;
    topMesh.castShadow = true;
    this.deskGroup.add(topMesh);

    // Bottom Panel
    const botGeo = new THREE.BoxGeometry(width, thickness, depth);
    const botMesh = new THREE.Mesh(botGeo, cabinetMat);
    botMesh.position.y = -height/2 + thickness/2;
    botMesh.castShadow = true;
    this.deskGroup.add(botMesh);

    // Left Panel
    const sideGeo = new THREE.BoxGeometry(thickness, height - thickness*2, depth);
    const leftMesh = new THREE.Mesh(sideGeo, cabinetMat);
    leftMesh.position.x = -width/2 + thickness/2;
    leftMesh.castShadow = true;
    this.deskGroup.add(leftMesh);

    // Right Panel
    const rightMesh = new THREE.Mesh(sideGeo, cabinetMat);
    rightMesh.position.x = width/2 - thickness/2;
    rightMesh.castShadow = true;
    this.deskGroup.add(rightMesh);

    // Fold Down Desk Surface
    const foldGeo = new THREE.BoxGeometry(width, height, thickness);
    this.foldPanel = new THREE.Mesh(foldGeo, cabinetMat);
    
    const hingeGroup = new THREE.Group();
    hingeGroup.position.set(0, -height/2, depth/2); 
    this.foldPanel.position.set(0, height/2, 0); 
    hingeGroup.add(this.foldPanel);
    
    if (state.isDeskOpen) {
      hingeGroup.rotation.x = Math.PI / 2; 
    } else {
      hingeGroup.rotation.x = 0; 
    }
    this.deskGroup.add(hingeGroup);

    // Text Labels (Inches)
    const wIn = (width / 25.4).toFixed(1) + '"';
    const hIn = (height / 25.4).toFixed(1) + '"';
    const dIn = (depth / 25.4).toFixed(1) + '"';

    const wLabel = this.createTextSprite(`W: ${wIn}`);
    wLabel.position.set(0, height/2 + 20, 0); // Above top panel
    this.deskGroup.add(wLabel);

    const hLabel = this.createTextSprite(`H: ${hIn}`);
    hLabel.position.set(-width/2 - 30, 0, 0); // Left of left panel
    this.deskGroup.add(hLabel);

    const dLabel = this.createTextSprite(`D: ${dIn}`);
    dLabel.position.set(width/2 + 30, -height/2, depth/2); // Front right corner
    this.deskGroup.add(dLabel);

    this.setupDragControls(width, height, depth, thickness);
  }

  private createTextSprite(message: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;  // Doubled canvas resolution for crispness
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context) {
      context.font = 'Bold 72px Arial'; // Increased font size significantly
      context.fillStyle = 'white';
      context.strokeStyle = 'black';
      context.lineWidth = 6;
      context.textAlign = 'center';
      
      // Outline
      context.strokeText(message, 256, 128);
      // Fill
      context.fillText(message, 256, 128);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    // Significantly increased the scale of the 3D sprite plane
    sprite.scale.set(250, 125, 1);
    
    return sprite;
  }

  private setupDragControls(width: number, height: number, depth: number, thickness: number) {
    if (this.dragControls) {
      this.dragControls.dispose();
    }
    
    this.dragControls = new DragControls(this.draggableObjects, this.camera, this.renderer.domElement);
    
    this.dragControls.addEventListener('dragstart', (event: any) => {
      this.controls.enabled = false; 
    });
    
    this.dragControls.addEventListener('drag', (event: any) => {
      // Lock movement to the Z plane of the back board
      event.object.position.z = -depth/2 + thickness + 10;
    });

    this.dragControls.addEventListener('dragend', (event: any) => {
      this.controls.enabled = true;
      
      const x3D = event.object.position.x;
      const y3D = event.object.position.y;
      const realW = event.object.geometry.parameters.width;
      const realH = event.object.geometry.parameters.height;
      
      // Convert 3D back to 2D state coordinates
      const pxX = x3D + width/2 - realW/2;
      const pxY = height/2 - y3D - realH/2;
      
      const stateX = pxX * 0.75;
      const stateY = pxY * 0.75;
      
      this.deskConfig.updateItemPosition(event.object.userData.id, stateX, stateY);
    });
  }

  private onWindowResize() {
    if (!this.canvasRef) return;
    const container = this.canvasRef.nativeElement;
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
