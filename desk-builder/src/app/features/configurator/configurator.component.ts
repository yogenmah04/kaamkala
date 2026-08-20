import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DeskConfigService, MATERIALS, MaterialOption, DeskDimensions } from '../../core/services/desk-config.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-configurator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './configurator.component.html',
  styleUrl: './configurator.component.css'
})
export class ConfiguratorComponent implements OnInit, OnDestroy {
  configForm: FormGroup;
  materials = MATERIALS;
  units = ['mm', 'cm', 'm', 'in', 'ft'];
  selectedUnit = 'mm';
  private destroy$ = new Subject<void>();

  // Base limits in mm
  limits = {
    width: { min: 800, max: 2000 },
    height: { min: 600, max: 1200 },
    depth: { min: 100, max: 400 }
  };

  currentLimits = JSON.parse(JSON.stringify(this.limits));

  monitorComponents = [
    { type: 'monitor', name: '24" Monitor', price: 150, weight: 5, realWidth: 530, realHeight: 300 },
    { type: 'monitor', name: '32" Ultrawide', price: 300, weight: 8, realWidth: 750, realHeight: 320 }
  ];

  layoutComponents = [
    { type: 'shelf', name: 'Wood Partition (Horizontal)', price: 40, weight: 2, canResize: true, l: 500, h: 20, b: 50, colorHex: '#d2b48c' },
    { type: 'shelf', name: 'Wood Partition (Vertical)', price: 40, weight: 2, canResize: true, l: 20, h: 400, b: 50, colorHex: '#d2b48c' }
  ];

  ledLightComponents = [
    { type: 'accessory', name: 'LED Light Strip', price: 20, weight: 0.5, canResize: true, l: 300, h: 10, b: 10, colorHex: '#fffbcc' }
  ];

  hardwareComponents = [
    { type: 'hardware', name: 'Gravitic Forcefield Node (Standard)', price: 150, weight: 0.5, canResize: false, realWidth: 40, realHeight: 40, colorHex: '#00ffff' },
    { type: 'hardware', name: 'Gravitic Forcefield Node (Heavy Duty)', price: 300, weight: 1.0, canResize: false, realWidth: 60, realHeight: 60, colorHex: '#00ffff' },
    { type: 'hardware', name: 'Gravitic Forcefield Node (Ultra)', price: 500, weight: 1.5, canResize: false, realWidth: 80, realHeight: 80, colorHex: '#00ffff' }
  ];

  preStyledThemes = [
    {
      name: 'DropTop Duo 24 Light',
      description: 'Dual 24" screens, lightweight setup with gravitic forcefield nodes.',
      dimensions: { width: 1200, height: 800, depth: 200 },
      cabinetColorHex: '#f0f0f0',
      panelColorHex: '#dcdcdc',
      items: [
        { type: 'monitor', name: '24" Monitor', price: 150, weight: 5, realWidth: 530, realHeight: 300, x: 50, y: 150 },
        { type: 'monitor', name: '24" Monitor', price: 150, weight: 5, realWidth: 530, realHeight: 300, x: 620, y: 150 },
        { type: 'shelf', name: 'Laptop Storage Shelf', price: 45, weight: 3, canResize: true, l: 1150, h: 20, b: 150, x: 25, y: 500, colorHex: '#c2a077' },
        { type: 'hardware', name: 'Forcefield Node (Left)', price: 150, weight: 0.5, canResize: false, realWidth: 40, realHeight: 40, x: 30, y: 200, colorHex: '#00ffff' },
        { type: 'hardware', name: 'Forcefield Node (Right)', price: 150, weight: 0.5, canResize: false, realWidth: 40, realHeight: 40, x: 1130, y: 200, colorHex: '#00ffff' }
      ]
    },
    {
      name: 'DropTop Duo 24',
      description: 'Dual 24" monitors, spacious layout, walnut finish.',
      dimensions: { width: 1200, height: 800, depth: 250 },
      cabinetColorHex: '#2b2b2b',
      panelColorHex: '#8b5a2b',
      items: [
        { type: 'monitor', name: '24" Monitor', price: 150, weight: 5, realWidth: 530, realHeight: 300, x: 50, y: 150 },
        { type: 'monitor', name: '24" Monitor', price: 150, weight: 5, realWidth: 530, realHeight: 300, x: 620, y: 150 },
        { type: 'shelf', name: 'Main Laptop Shelf', price: 45, weight: 3, canResize: true, l: 1150, h: 20, b: 200, x: 25, y: 500, colorHex: '#e0c097' },
        { type: 'shelf', name: 'Left Cubby Divider', price: 20, weight: 1, canResize: true, l: 20, h: 150, b: 200, x: 25, y: 520, colorHex: '#e0c097' },
        { type: 'shelf', name: 'Center Cubby Divider', price: 20, weight: 1, canResize: true, l: 20, h: 150, b: 200, x: 590, y: 520, colorHex: '#e0c097' },
        { type: 'shelf', name: 'Right Cubby Divider', price: 20, weight: 1, canResize: true, l: 20, h: 150, b: 200, x: 1155, y: 520, colorHex: '#e0c097' },
        { type: 'accessory', name: 'LED Light Strip', price: 20, weight: 0.5, canResize: true, l: 1150, h: 10, b: 10, x: 25, y: 490, colorHex: '#fffbcc' }
      ]
    },
    {
      name: 'DropTop Single 32',
      description: 'Single 32" ultrawide, minimalist setup, slate grey.',
      dimensions: { width: 1000, height: 750, depth: 200 },
      cabinetColorHex: '#708090',
      panelColorHex: '#708090',
      items: [
        { type: 'monitor', name: '32" Ultrawide', price: 300, weight: 8, realWidth: 750, realHeight: 320, x: 125, y: 100 },
        { type: 'shelf', name: 'Storage Shelf', price: 40, weight: 2.5, canResize: true, l: 950, h: 20, b: 180, x: 25, y: 450, colorHex: '#b0c4de' },
        { type: 'shelf', name: 'Center Support Divider', price: 20, weight: 1, canResize: true, l: 20, h: 150, b: 180, x: 490, y: 470, colorHex: '#b0c4de' }
      ]
    },
    {
      name: 'DropTop Compact',
      description: 'Compact 800x600 for small spaces. Matte black and pure white.',
      dimensions: { width: 800, height: 600, depth: 200 },
      cabinetColorHex: '#222222',
      panelColorHex: '#ffffff',
      items: [
        { type: 'monitor', name: '24" Monitor', price: 150, weight: 5, realWidth: 530, realHeight: 300, x: 135, y: 80 },
        { type: 'shelf', name: 'Compact Bottom Shelf', price: 35, weight: 2, canResize: true, l: 750, h: 20, b: 150, x: 25, y: 420, colorHex: '#dcdcdc' }
      ]
    }
  ];

  constructor(
    private fb: FormBuilder,
    public deskConfig: DeskConfigService,
    private pdfExportService: PdfExportService
  ) {
    this.configForm = this.fb.group({
      width: [1200, [Validators.required, Validators.min(this.limits.width.min), Validators.max(this.limits.width.max)]],
      height: [800, [Validators.required, Validators.min(this.limits.height.min), Validators.max(this.limits.height.max)]],
      depth: [200, [Validators.required, Validators.min(this.limits.depth.min), Validators.max(this.limits.depth.max)]],
      cabinetMaterialId: [MATERIALS[0].id, Validators.required],
      panelMaterialId: [MATERIALS[1].id, Validators.required]
    });
  }

  ngOnInit() {
    this.configForm.valueChanges.subscribe(value => {
      if (this.configForm.valid) {
        const dimensions: DeskDimensions = {
          width: this.convertToMm(value.width, this.selectedUnit),
          height: this.convertToMm(value.height, this.selectedUnit),
          depth: this.convertToMm(value.depth, this.selectedUnit)
        };
        this.deskConfig.updateDimensions(dimensions);

        const cabinetMaterial = this.materials.find(m => m.id === value.cabinetMaterialId);
        if (cabinetMaterial) {
          this.deskConfig.updateCabinetMaterial(cabinetMaterial);
        }

        const panelMaterial = this.materials.find(m => m.id === value.panelMaterialId);
        if (panelMaterial) {
          this.deskConfig.updatePanelMaterial(panelMaterial);
        }
      }
    });
  }

  onUnitChange(newUnit: string) {
    const oldUnit = this.selectedUnit;
    this.selectedUnit = newUnit;

    // Convert values
    const currentValues = this.configForm.value;
    const newWidth = this.convertBetween(currentValues.width, oldUnit, newUnit);
    const newHeight = this.convertBetween(currentValues.height, oldUnit, newUnit);
    const newDepth = this.convertBetween(currentValues.depth, oldUnit, newUnit);

    // Update Limits
    this.currentLimits.width.min = this.convertBetween(this.limits.width.min, 'mm', newUnit);
    this.currentLimits.width.max = this.convertBetween(this.limits.width.max, 'mm', newUnit);
    this.currentLimits.height.min = this.convertBetween(this.limits.height.min, 'mm', newUnit);
    this.currentLimits.height.max = this.convertBetween(this.limits.height.max, 'mm', newUnit);
    this.currentLimits.depth.min = this.convertBetween(this.limits.depth.min, 'mm', newUnit);
    this.currentLimits.depth.max = this.convertBetween(this.limits.depth.max, 'mm', newUnit);

    // Update form controls without emitting event to prevent infinite loop
    this.configForm.patchValue({
      width: Number(newWidth.toFixed(2)),
      height: Number(newHeight.toFixed(2)),
      depth: Number(newDepth.toFixed(2))
    }, { emitEvent: false });

    // Update validators
    this.updateValidators('width', this.currentLimits.width.min, this.currentLimits.width.max);
    this.updateValidators('height', this.currentLimits.height.min, this.currentLimits.height.max);
    this.updateValidators('depth', this.currentLimits.depth.min, this.currentLimits.depth.max);
  }

  addComponent(comp: any) {
    const scale = 0.75; // Convert mm to 2D UI pixel scale
    let width, height, itemDepth;

    if (comp.canResize) {
      width = comp.l * scale;
      height = comp.h * scale;
      itemDepth = comp.b * scale; // New 3D depth axis
    } else if (comp.type === 'monitor' || comp.type === 'hardware') {
      width = comp.realWidth * scale;
      height = comp.realHeight * scale;
    }

    // Default position slightly offset so they don't perfectly stack
    const x = 50 + Math.random() * 50;
    const y = 50 + Math.random() * 50;

    this.deskConfig.addItem({
      type: comp.type,
      name: comp.name + (comp.canResize ? ` (${comp.l}x${comp.h}x${comp.b}mm)` : ''),
      x: x,
      y: y,
      price: comp.price,
      weight: comp.weight,
      width,
      height,
      itemDepth,
      colorHex: comp.colorHex
    });
  }

  removeItem(id: string) {
    this.deskConfig.removeItem(id);
  }

  applyTheme(theme: any) {
    // Update form to reflect new dimensions
    const scaleToUnit = (val: number) => this.convertBetween(val, 'mm', this.selectedUnit);
    this.configForm.patchValue({
      width: Number(scaleToUnit(theme.dimensions.width).toFixed(2)),
      height: Number(scaleToUnit(theme.dimensions.height).toFixed(2)),
      depth: Number(scaleToUnit(theme.dimensions.depth).toFixed(2))
    });

    const itemsWithIds = theme.items.map((item: any) => {
       const scale = 0.75;
       let width = item.realWidth ? item.realWidth * scale : (item.l ? item.l * scale : 100);
       let height = item.realHeight ? item.realHeight * scale : (item.h ? item.h * scale : 100);
       let itemDepth = item.b ? item.b * scale : 0;
       return {
         ...item,
         id: Math.random().toString(36).substring(2, 9),
         width,
         height,
         itemDepth,
         colorHex: item.colorHex || undefined
       };
    });

    this.deskConfig.loadTheme({
      dimensions: theme.dimensions,
      cabinetColorHex: theme.cabinetColorHex,
      panelColorHex: theme.panelColorHex,
      items: itemsWithIds
    });
  }

  getModifiableItems(items: any[] | undefined) {
    if (!items) return [];
    return items;
  }

  getDisplayValue(valMm: number): number {
    return Number(this.convertBetween(valMm, 'mm', this.selectedUnit).toFixed(2));
  }

  getMmValue(displayVal: number): number {
    return this.convertToMm(displayVal, this.selectedUnit);
  }

  exportToPdf() {
    // Get latest state synchronously
    let currentState;
    this.deskConfig.state$.pipe(takeUntil(this.destroy$)).subscribe(state => currentState = state).unsubscribe();
    if (currentState) {
      this.pdfExportService.exportPdf(currentState);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateValidators(controlName: string, min: number, max: number) {
    const control = this.configForm.get(controlName);
    if (control) {
      control.setValidators([Validators.required, Validators.min(min), Validators.max(max)]);
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private convertToMm(value: number, unit: string): number {
    switch (unit) {
      case 'cm': return value * 10;
      case 'm': return value * 1000;
      case 'in': return value * 25.4;
      case 'ft': return value * 304.8;
      default: return value; // mm
    }
  }

  private convertBetween(value: number, fromUnit: string, toUnit: string): number {
    const mm = this.convertToMm(value, fromUnit);
    switch (toUnit) {
      case 'cm': return mm / 10;
      case 'm': return mm / 1000;
      case 'in': return mm / 25.4;
      case 'ft': return mm / 304.8;
      default: return mm; // mm
    }
  }
}
