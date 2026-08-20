import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { BedConfigService, BedItem } from '../../core/services/bed-config.service';

@Component({
  selector: 'app-bed-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './bed-canvas.component.html',
  styleUrl: './bed-canvas.component.css'
})
export class BedCanvasComponent {
  rotationX = 65;
  rotationZ = -20;
  zoomScale = 1;
  showMeasurements = false;
  
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Custom 3D drag properties
  private draggingItem: BedItem | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialItemX = 0;
  private initialItemY = 0;

  constructor(public bedConfig: BedConfigService) {}

  startDrag(event: MouseEvent) {
    if ((event.target as HTMLElement).closest('.cdk-drag')) {
      return; // Do not rotate the camera if clicking on a draggable component
    }
    this.isDragging = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    event.preventDefault(); // Prevent text selection
  }

  @HostListener('window:mousemove', ['$event'])
  onDrag(event: MouseEvent) {
    if (!this.isDragging) return;
    
    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;
    
    // Adjust sensitivity and invert horizontal rotation
    this.rotationZ -= deltaX * 0.5;
    this.rotationX -= deltaY * 0.5;
    
    // Constrain X rotation to prevent flipping upside down
    if (this.rotationX > 90) this.rotationX = 90;
    if (this.rotationX < 0) this.rotationX = 0;

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  @HostListener('window:mouseup')
  endDrag() {
    this.isDragging = false;
  }

  resetToTopDown() {
    this.rotationX = 0;
    this.rotationZ = 0;
    this.zoomScale = 1;
  }

  onWheel(event: WheelEvent) {
    event.preventDefault(); // prevent page scrolling
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

  onDragEnded(event: CdkDragEnd, item: BedItem) {
    const position = event.source.getFreeDragPosition();
    this.bedConfig.updateItemPosition(item.id, position.x, position.y);
  }

  onItemResize(item: BedItem, event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    // The CSS resize dynamically changes clientWidth/clientHeight.
    // We scale it back to mm (scale factor is 0.25, so multiply by 4)
    const newWidth = el.clientWidth * 4;
    const newHeight = el.clientHeight * 4;
    
    // Only update if dimensions actually changed significantly (avoiding sub-pixel rounding loops)
    if (Math.abs((item.width || 0) - newWidth) > 5 || Math.abs((item.height || 0) - newHeight) > 5) {
      this.bedConfig.updateItemDimensions(item.id, newWidth, newHeight);
    }
  }

  trackByItem(index: number, item: BedItem) {
    return item.id;
  }

  removeItem(id: string) {
    this.bedConfig.removeItem(id);
  }

  getUIZTranslate(item: any, state: any, zOffset: number): string {
    const realDepthMm = item.itemDepth || 200;
    let baseZ = realDepthMm * 0.25; 
    
    if (item.type === 'human') baseZ = 300 * 0.25;
    if (item.type === 'hardware') baseZ = 150 * 0.25;
    if (item.type === 'drawer') baseZ = 0; // Drawer is under the bed, top face is at Z=0

    let transformStr = `translateZ(${baseZ + zOffset}px)`;
    
    if (state.isStorageOpen && item.type === 'drawer') {
        const isLeft = item.x < ((state.dimensions.width || 1600) / 2);
        transformStr = (isLeft ? 'translateX(-80%) ' : 'translateX(80%) ') + transformStr;
    } else {
        transformStr = 'translateX(0%) ' + transformStr;
    }

    return transformStr;
  }

  getItemPhysicalTransform(item: any, state: any): string {
    let baseZ = 0;
    if (item.type === 'drawer') {
      baseZ = -((item.itemDepth || 200) * 0.25);
    }
    
    let transformStr = `translateZ(${baseZ}px)`;
    
    if (state.isStorageOpen && item.type === 'drawer') {
        const isLeft = item.x < ((state.dimensions.width || 1600) / 2);
        transformStr = (isLeft ? 'translateX(-80%) ' : 'translateX(80%) ') + transformStr;
    } else {
        transformStr = 'translateX(0%) ' + transformStr;
    }

    return transformStr;
  }
}
