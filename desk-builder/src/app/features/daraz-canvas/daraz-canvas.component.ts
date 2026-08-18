import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { DarazConfigService, DarazItem } from '../../core/services/daraz-config.service';

@Component({
  selector: 'app-daraz-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './daraz-canvas.component.html',
  styleUrl: './daraz-canvas.component.css'
})
export class DarazCanvasComponent {
  rotationX = 0;
  rotationZ = 0;
  zoomScale = 1;
  showMeasurements = false;
  
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  constructor(public darazConfig: DarazConfigService) {}

  startDrag(event: MouseEvent) {
    if ((event.target as HTMLElement).closest('.cdk-drag')) {
      return; 
    }
    this.isDragging = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    event.preventDefault(); 
  }

  @HostListener('window:mousemove', ['$event'])
  onDrag(event: MouseEvent) {
    if (!this.isDragging) return;
    
    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;
    
    this.rotationZ += deltaX * 0.5;
    this.rotationX -= deltaY * 0.5;
    
    if (this.rotationX > 90) this.rotationX = 90;
    if (this.rotationX < -90) this.rotationX = -90;

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  @HostListener('window:mouseup')
  endDrag() {
    this.isDragging = false;
  }

  resetToFront() {
    this.rotationX = 0;
    this.rotationZ = 0;
    this.zoomScale = 1;
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomDelta = event.deltaY > 0 ? -0.1 : 0.1;
    this.zoomScale = Math.max(0.2, Math.min(this.zoomScale + zoomDelta, 3));
  }

  zoomIn() {
    this.zoomScale = Math.min(this.zoomScale + 0.1, 3);
  }

  zoomOut() {
    this.zoomScale = Math.max(this.zoomScale - 0.1, 0.2);
  }

  toggleMeasurements() {
    this.showMeasurements = !this.showMeasurements;
  }

  formatMeasurement(mm: number, unit: string): string {
    switch (unit) {
      case 'cm': return (mm / 10).toFixed(1) + ' cm';
      case 'm': return (mm / 1000).toFixed(2) + ' m';
      case 'in': return (mm / 25.4).toFixed(1) + '"';
      case 'ft': return (mm / 304.8).toFixed(2) + ' ft';
      default: return Math.round(mm) + ' mm';
    }
  }

  onDragEnded(event: CdkDragEnd, item: DarazItem) {
    const position = event.source.getFreeDragPosition();
    this.darazConfig.updateItemPosition(item.id, position.x, position.y);
  }

  onItemResize(item: DarazItem, event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    const newWidth = el.clientWidth * 4;
    const newHeight = el.clientHeight * 4;
    
    if (Math.abs((item.width || 0) - newWidth) > 5 || Math.abs((item.height || 0) - newHeight) > 5) {
      this.darazConfig.updateItemDimensions(item.id, newWidth, newHeight, item.itemDepth);
    }
  }

  trackByItem(index: number, item: DarazItem) {
    return item.id;
  }

  removeItem(id: string) {
    this.darazConfig.removeItem(id);
  }

  getUIZTranslate(item: any, state: any, zOffset: number): string {
    const realDepthMm = item.itemDepth || state.dimensions.width || 600;
    
    // Default front face is at depth * 0.25
    let baseZ = realDepthMm * 0.25; 

    // Hanger rods are positioned exactly in the middle of the wardrobe (depth * 0.125)
    if (item.type === 'hanger-rod') {
      baseZ = realDepthMm * 0.125;
    }

    // Drawers no longer auto-slide out when doors are open to preserve layout visualization
    let slideOffset = 0;

    return `translateZ(${baseZ + slideOffset + zOffset}px)`;
  }
}
