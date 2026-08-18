import { Injectable } from '@angular/core';
import { DeskConfigState } from './desk-config.service';
import { BedConfigState } from './bed-config.service';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  constructor() {}

  async exportPdf(state: DeskConfigState) {
    // Initialize jsPDF document (A4 size, mm units)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 1. Add Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Custom Wall-Mounted Desk Blueprint', 15, 20);
    
    // Add subtitle/date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 28);

    // 2. Capture and Embed 3D Viewer Image
    try {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        // Add image to PDF (x: 15, y: 35, width: 180, height: proportional)
        // Canvas is roughly 16:9 or similar depending on layout
        doc.addImage(imgData, 'PNG', 15, 35, 180, 100);
        doc.setDrawColor(200);
        doc.rect(15, 35, 180, 100); // Draw border around image
      }
    } catch (e) {
      console.error('Failed to capture 3D canvas', e);
      doc.text('[3D Preview Unavailable - Canvas Capture Failed]', 15, 50);
    }

    // 3. Master Dimensions Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Master Dimensions (Outer Cabinet)', 15, 145);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Width: ${state.dimensions.width} mm`, 20, 153);
    doc.text(`Height: ${state.dimensions.height} mm`, 20, 160);
    doc.text(`Depth: ${state.dimensions.depth} mm`, 20, 167);

    // 4. Materials
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Materials & Colors', 110, 145);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cabinet: ${state.cabinetMaterial?.name} (Color: ${state.cabinetColorHex || 'Default'})`, 115, 153);
    doc.text(`Panel: ${state.panelMaterial?.name} (Color: ${state.panelColorHex || 'Default'})`, 115, 160);

    // 5. Cut List / Internal Components
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Internal Components (Manufacturing Cut List)', 15, 185);

    // Table Header
    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 190, 180, 8, 'F');
    doc.text('Item Type / Name', 18, 195);
    doc.text('Length (mm)', 110, 195);
    doc.text('Height (mm)', 140, 195);
    doc.text('Depth (mm)', 170, 195);

    doc.setFont('helvetica', 'normal');
    let y = 205;

    if (state.items && state.items.length > 0) {
      state.items.forEach((item, index) => {
        // Handle page breaks
        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        // Only Wood Partitions & LEDs have "itemDepth", monitors use 20.
        const length = Math.round((item.width || 0) / 0.75); // Convert from 2D pixel state back to mm
        const height = Math.round((item.height || 0) / 0.75);
        const depth = item.type === 'monitor' ? 20 : Math.round((item.itemDepth || 0) / 0.75);

        doc.text(`- ${item.name}`, 18, y);
        doc.text(`${length}`, 115, y);
        doc.text(`${height}`, 145, y);
        doc.text(`${depth}`, 175, y);
        
        y += 8;
      });
    } else {
      doc.text('No internal components added.', 18, 205);
    }

    // Save PDF
    doc.save('Desk_Blueprint.pdf');
  }

  async exportBedPdf(state: BedConfigState) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 1. Add Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Custom Bed Blueprint & Cut List', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 28);

    // 2. Master Dimensions Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Master Dimensions', 15, 45);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Length: ${state.dimensions.length} mm`, 20, 53);
    doc.text(`Width: ${state.dimensions.width} mm`, 20, 60);
    doc.text(`Height (Clearance): ${state.dimensions.height} mm`, 20, 67);

    // 3. Materials
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Materials & Colors', 110, 45);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Frame: ${state.frameMaterial?.name} (Color: ${state.frameColorHex || 'Default'})`, 115, 53);
    doc.text(`Headboard: ${state.headboardMaterial?.name} (Color: ${state.headboardColorHex || 'Default'})`, 115, 60);

    // 4. Cut List / Internal Components
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Modular Components', 15, 85);

    // Table Header
    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 90, 180, 8, 'F');
    doc.text('Component Name', 18, 95);
    doc.text('Type', 110, 95);
    doc.text('Dimensions (mm)', 140, 95);

    doc.setFont('helvetica', 'normal');
    let y = 105;

    if (state.items && state.items.length > 0) {
      state.items.forEach((item, index) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        doc.text(`- ${item.name}`, 18, y);
        doc.text(`${item.type}`, 115, y);
        const dims = (item.width && item.height) ? `${item.width} x ${item.height}` : 'Standard';
        doc.text(dims, 145, y);
        
        y += 8;
      });
    } else {
      doc.text('No modular components added.', 18, 105);
    }

    doc.save('Bed_Blueprint.pdf');
  }
}
