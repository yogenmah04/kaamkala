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

  partitionComponents = [
    { type: 'shelf', name: 'Wood Partition (Horizontal)', price: 40, weight: 2, canResize: true, l: 500, h: 20, b: 50 },
    { type: 'shelf', name: 'Wood Partition (Vertical)', price: 40, weight: 2, canResize: true, l: 20, h: 400, b: 50 },
    { type: 'accessory', name: 'LED Light Strip', price: 20, weight: 0.5, canResize: true, l: 300, h: 10, b: 10 }
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
    } else if (comp.type === 'monitor') {
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
      itemDepth
    });
  }

  removeItem(id: string) {
    this.deskConfig.removeItem(id);
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
