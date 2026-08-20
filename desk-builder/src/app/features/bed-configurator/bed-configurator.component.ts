import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { BedConfigService, BED_MATERIALS, BED_THEMES } from '../../core/services/bed-config.service';
import { PdfExportService } from '../../core/services/pdf-export.service';

@Component({
  selector: 'app-bed-configurator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './bed-configurator.component.html'
})
export class BedConfiguratorComponent implements OnDestroy {
  configForm: FormGroup;
  destroy$ = new Subject<void>();
  
  preStyledThemes = BED_THEMES;
  materials = BED_MATERIALS;
  
  units = ['mm', 'cm', 'm', 'in', 'ft'];
  selectedUnit = 'mm';

  // Base limits in mm
  limits = {
    length: { min: 1000, max: 5000 },
    width: { min: 500, max: 4000 },
    height: { min: 100, max: 2000 }
  };

  currentLimits = JSON.parse(JSON.stringify(this.limits));

  availableComponents = [
    { type: 'human', name: 'Human Silhouette', price: 0, weight: 75, realWidth: 600, realHeight: 1800, colorHex: 'rgba(0, 0, 0, 0.15)' },
    { type: 'headboard', name: 'Modular Headboard', price: 100, weight: 10, realWidth: 1600, realHeight: 200, colorHex: '#4a4a4a' },
    { type: 'partition', name: 'Horizontal Partition', price: 40, weight: 5, realWidth: 1000, realHeight: 20, colorHex: '#d2b48c' },
    { type: 'partition', name: 'Vertical Partition', price: 40, weight: 5, realWidth: 20, realHeight: 1000, colorHex: '#d2b48c' },
    { type: 'drawer', name: 'Storage Drawer', price: 150, weight: 12, realWidth: 900, realHeight: 300, colorHex: '#ffffff' },
    { type: 'led', name: 'Horizontal LED Strip', price: 60, weight: 1, realWidth: 1500, realHeight: 20, colorHex: '#00ffff' },
    { type: 'led', name: 'Vertical LED Strip', price: 60, weight: 1, realWidth: 20, realHeight: 1500, colorHex: '#00ffff' }
  ];

  constructor(
    private fb: FormBuilder,
    public bedConfig: BedConfigService,
    private pdfExportService: PdfExportService
  ) {
    this.configForm = this.fb.group({
      length: [2000, [Validators.required, Validators.min(this.limits.length.min), Validators.max(this.limits.length.max)]],
      width: [1600, [Validators.required, Validators.min(this.limits.width.min), Validators.max(this.limits.width.max)]],
      height: [350, [Validators.required, Validators.min(this.limits.height.min), Validators.max(this.limits.height.max)]]
    });

    this.configForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      if (this.configForm.valid) {
        this.bedConfig.updateDimensions({ 
          length: this.convertToMm(val.length, this.selectedUnit), 
          width: this.convertToMm(val.width, this.selectedUnit), 
          height: this.convertToMm(val.height, this.selectedUnit) 
        });
      }
    });
  }

  onUnitChange(newUnit: string) {
    const oldUnit = this.selectedUnit;
    this.selectedUnit = newUnit;
    this.bedConfig.updateUnit(newUnit);

    const currentValues = this.configForm.value;
    const newLength = this.convertBetween(currentValues.length, oldUnit, newUnit);
    const newWidth = this.convertBetween(currentValues.width, oldUnit, newUnit);
    const newHeight = this.convertBetween(currentValues.height, oldUnit, newUnit);

    this.currentLimits.length.min = this.convertBetween(this.limits.length.min, 'mm', newUnit);
    this.currentLimits.length.max = this.convertBetween(this.limits.length.max, 'mm', newUnit);
    this.currentLimits.width.min = this.convertBetween(this.limits.width.min, 'mm', newUnit);
    this.currentLimits.width.max = this.convertBetween(this.limits.width.max, 'mm', newUnit);
    this.currentLimits.height.min = this.convertBetween(this.limits.height.min, 'mm', newUnit);
    this.currentLimits.height.max = this.convertBetween(this.limits.height.max, 'mm', newUnit);

    this.configForm.patchValue({
      length: Number(newLength.toFixed(2)),
      width: Number(newWidth.toFixed(2)),
      height: Number(newHeight.toFixed(2))
    }, { emitEvent: false });

    this.updateValidators('length', this.currentLimits.length.min, this.currentLimits.length.max);
    this.updateValidators('width', this.currentLimits.width.min, this.currentLimits.width.max);
    this.updateValidators('height', this.currentLimits.height.min, this.currentLimits.height.max);
  }

  applyTheme(theme: any) {
    const scaleToUnit = (val: number) => this.convertBetween(val, 'mm', this.selectedUnit);
    
    this.configForm.patchValue({
      length: Number(scaleToUnit(theme.dimensions.length).toFixed(2)),
      width: Number(scaleToUnit(theme.dimensions.width).toFixed(2)),
      height: Number(scaleToUnit(theme.dimensions.height).toFixed(2))
    });

    this.bedConfig.loadTheme({
      dimensions: theme.dimensions,
      frameMaterial: theme.frameMaterial,
      headboardMaterial: theme.headboardMaterial,
      frameColorHex: theme.frameColorHex,
      headboardColorHex: theme.headboardColorHex,
      items: theme.items.map((item: any) => ({
        ...item,
        id: Math.random().toString(36).substring(2, 9)
      }))
    });
  }

  updateFrameMaterial(id: string) {
    const material = this.materials.find(m => m.id === id);
    if (material) this.bedConfig.updateFrameMaterial(material);
  }

  updateHeadboardMaterial(id: string) {
    const material = this.materials.find(m => m.id === id);
    if (material) this.bedConfig.updateHeadboardMaterial(material);
  }

  addComponent(comp: any) {
    let width = comp.realWidth;
    let height = comp.realHeight;

    // Auto-adjust headboard to fit the bed width
    if (comp.type === 'headboard') {
      this.bedConfig.state$.pipe(takeUntil(this.destroy$)).subscribe(state => {
        width = state.dimensions.width;
      }).unsubscribe();
    }

    this.bedConfig.addItem({
      type: comp.type,
      name: comp.name,
      price: comp.price,
      weight: comp.weight,
      width: width,
      height: height,
      x: 50 + Math.random() * 50,
      y: 50 + Math.random() * 50,
      colorHex: comp.colorHex
    });
  }

  removeItem(id: string) {
    this.bedConfig.removeItem(id);
  }

  updateItemDim(item: any, w: number, h: number, d: number) {
    this.bedConfig.updateItemDimensions(item.id, w, h, d);
  }

  trackByItem(index: number, item: any) {
    return item.id;
  }

  exportToPdf() {
    let currentState;
    this.bedConfig.state$.pipe(takeUntil(this.destroy$)).subscribe(state => currentState = state).unsubscribe();
    if (currentState) {
      this.pdfExportService.exportBedPdf(currentState);
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
