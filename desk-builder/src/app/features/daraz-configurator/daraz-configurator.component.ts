import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DarazConfigService, DARAZ_MATERIALS, DARAZ_THEMES } from '../../core/services/daraz-config.service';
import { PdfExportService } from '../../core/services/pdf-export.service';

@Component({
  selector: 'app-daraz-configurator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './daraz-configurator.component.html',
  styleUrl: './daraz-configurator.component.css'
})
export class DarazConfiguratorComponent implements OnDestroy {
  configForm: FormGroup;
  destroy$ = new Subject<void>();
  
  preStyledThemes = DARAZ_THEMES;
  materials = DARAZ_MATERIALS;
  
  units = ['mm', 'cm', 'm', 'in', 'ft'];
  selectedUnit = 'mm';

  limits = {
    length: { min: 600, max: 4000 },
    width: { min: 400, max: 1200 },
    height: { min: 1000, max: 3000 }
  };

  currentLimits = JSON.parse(JSON.stringify(this.limits));

  availableComponents = [
    { type: 'human', name: 'Human Silhouette', price: 0, weight: 75, realWidth: 600, realHeight: 1800, colorHex: 'rgba(0, 0, 0, 0.15)' },
    { type: 'hanger-rod', name: 'Hanger Rod', price: 20, weight: 1, realWidth: 1000, realHeight: 20, colorHex: '#aaaaaa' },
    { type: 'shelf', name: 'Horizontal Shelf', price: 40, weight: 5, realWidth: 1000, realHeight: 20, colorHex: '#d2b48c' },
    { type: 'shelf', name: 'Side Stack Shelf', price: 30, weight: 4, realWidth: 450, realHeight: 20, colorHex: '#f5f5dc' },
    { type: 'vertical-divider', name: 'Vertical Divider', price: 40, weight: 5, realWidth: 20, realHeight: 1000, colorHex: '#d2b48c' },
    { type: 'drawer', name: 'Storage Drawer', price: 150, weight: 12, realWidth: 900, realHeight: 300, colorHex: '#ffffff' },
    { type: 'drawer', name: 'Pull-Out Drawer Unit', price: 80, weight: 10, realWidth: 450, realHeight: 200, colorHex: '#ffffff' }
  ];

  constructor(
    private fb: FormBuilder,
    public darazConfig: DarazConfigService,
    private pdfExportService: PdfExportService
  ) {
    this.configForm = this.fb.group({
      length: [1200, [Validators.required, Validators.min(this.limits.length.min), Validators.max(this.limits.length.max)]],
      width: [600, [Validators.required, Validators.min(this.limits.width.min), Validators.max(this.limits.width.max)]],
      height: [2000, [Validators.required, Validators.min(this.limits.height.min), Validators.max(this.limits.height.max)]]
    });

    this.configForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      if (this.configForm.valid) {
        this.darazConfig.updateDimensions({ 
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
    this.darazConfig.updateUnit(newUnit);

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

    this.darazConfig.loadTheme({
      dimensions: theme.dimensions,
      innerMaterial: theme.innerMaterial,
      outerDoorMaterial: theme.outerDoorMaterial,
      innerColorHex: theme.innerColorHex,
      outerDoorColorHex: theme.outerDoorColorHex,
      items: theme.items.map((item: any) => ({
        ...item,
        id: Math.random().toString(36).substring(2, 9)
      }))
    });
  }

  updateInnerMaterial(id: string) {
    const material = this.materials.find(m => m.id === id);
    if (material) this.darazConfig.updateInnerMaterial(material);
  }

  updateOuterDoorMaterial(id: string) {
    const material = this.materials.find(m => m.id === id);
    if (material) this.darazConfig.updateOuterDoorMaterial(material);
  }

  addComponent(comp: any) {
    const currentState = this.darazConfig.getCurrentState();
    const maxWidth = currentState.dimensions.length; // length is the internal width of the wardrobe
    
    // Cap width to fit inside wardrobe if it's too big, with slight padding
    let initialWidth = comp.realWidth;
    if (initialWidth > maxWidth) {
      initialWidth = maxWidth - 100; // 100mm padding
    }

    let defaultDepth = currentState.dimensions.width;
    if (comp.type === 'drawer') {
      defaultDepth = defaultDepth > 100 ? defaultDepth - 100 : defaultDepth; // Recess drawers by 100mm
    } else if (comp.type === 'shelf') {
      defaultDepth = defaultDepth > 50 ? defaultDepth - 50 : defaultDepth; // Recess shelves by 50mm
    }

    this.darazConfig.addItem({
      type: comp.type,
      name: comp.name,
      price: comp.price,
      weight: comp.weight,
      width: initialWidth,
      height: comp.realHeight,
      itemDepth: defaultDepth,
      x: 20 + Math.random() * 30, // spawn slightly offset
      y: 20 + Math.random() * 30,
      colorHex: comp.colorHex
    });
  }

  updateItemSize(item: any, width: number, height: number, depth?: number) {
    this.darazConfig.updateItemDimensions(item.id, width, height, depth);
  }

  getDisplayValue(mm: number): number {
    return Number(this.convertBetween(mm, 'mm', this.selectedUnit).toFixed(2));
  }

  onItemSizeChange(item: any, field: 'width' | 'height' | 'itemDepth', displayVal: number) {
    const mmVal = this.convertToMm(displayVal, this.selectedUnit);
    let newWidth = item.width || 0;
    let newHeight = item.height || 0;
    let newDepth = item.itemDepth;

    if (field === 'width') newWidth = mmVal;
    if (field === 'height') newHeight = mmVal;
    if (field === 'itemDepth') newDepth = mmVal;

    this.darazConfig.updateItemDimensions(item.id, newWidth, newHeight, newDepth);
  }

  removeItem(id: string) {
    this.darazConfig.removeItem(id);
  }

  trackByItem(index: number, item: any): string {
    return item.id;
  }

  exportToPdf() {
    let currentState;
    this.darazConfig.state$.pipe(takeUntil(this.destroy$)).subscribe(state => currentState = state).unsubscribe();
    if (currentState) {
      this.pdfExportService.exportDarazPdf(currentState);
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
