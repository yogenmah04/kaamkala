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
  }

  toggleMeasurements() {
    this.showMeasurements = !this.showMeasurements;
  }

  toInches(mm: number): string {
    return (mm / 25.4).toFixed(1) + '"';
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
}
