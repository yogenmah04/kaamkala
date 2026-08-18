import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export interface DarazDimensions {
  length: number; // mm (Width of the wardrobe left to right)
  width: number; // mm (Depth of the wardrobe front to back)
  height: number; // mm (Height of the wardrobe top to bottom)
}

export interface MaterialOption {
  id: string;
  name: string;
  pricePerSqM: number;
}

export interface DarazItem {
  id: string;
  type: string; // 'shelf', 'drawer', 'hanger-rod', 'vertical-divider', 'human'
  name: string;
  x: number;
  y: number;
  price: number;
  weight: number; // kg
  width?: number; // Optional custom width for rendering (px)
  height?: number; // Optional custom height for rendering (px)
  itemDepth?: number; // Optional custom depth for 3D rendering (px)
  colorHex?: string; // Optional custom color
}

export interface DarazConfigState {
  dimensions: DarazDimensions;
  innerMaterial: MaterialOption;
  outerDoorMaterial: MaterialOption;
  innerColorHex: string;
  outerDoorColorHex: string;
  isDoorOpen: boolean;
  doorStyle: 'hinged' | '3-door' | 'sliding' | 'folding' | 'pivot' | 'push-to-open' | 'lift-up' | 'drop-down' | 'open';
  items: DarazItem[];
  selectedUnit: string;
}

export const DARAZ_MATERIALS: MaterialOption[] = [
  { id: 'matte-black', name: 'Matte Black MDF', pricePerSqM: 50 },
  { id: 'walnut', name: 'Walnut Veneer', pricePerSqM: 120 },
  { id: 'oak', name: 'Oak Veneer', pricePerSqM: 100 },
  { id: 'slate-grey', name: 'Slate Grey Laminate', pricePerSqM: 60 },
  { id: 'white', name: 'Pure White Gloss', pricePerSqM: 40 },
  { id: 'glass', name: 'Frosted Glass', pricePerSqM: 150 }
];

export const DARAZ_THEMES = [
  {
    name: 'Minimalist 2-Door',
    description: 'A sleek, compact wardrobe with pure white doors and oak internals.',
    dimensions: { length: 1200, width: 600, height: 2000 },
    innerColorHex: '#d2b48c',
    outerDoorColorHex: '#f5f5f5',
    innerMaterial: DARAZ_MATERIALS.find(m => m.id === 'oak'),
    outerDoorMaterial: DARAZ_MATERIALS.find(m => m.id === 'white'),
    doorStyle: 'hinged' as const,
    items: [
      { type: 'hanger-rod', name: 'Main Hanger Rod', price: 20, weight: 1, realWidth: 1100, realHeight: 20, x: 12.5, y: 37.5, colorHex: '#aaaaaa' },
      { type: 'shelf', name: 'Top Shelf', price: 40, weight: 5, realWidth: 1100, realHeight: 20, x: 12.5, y: 25, itemDepth: 550, colorHex: '#d2b48c' },
      { type: 'drawer', name: 'Bottom Storage Drawer', price: 100, weight: 8, realWidth: 1100, realHeight: 300, x: 12.5, y: 400, itemDepth: 500, colorHex: '#d2b48c' }
    ]
  },
  {
    name: 'Walk-in Master',
    description: 'Massive open-concept wardrobe with dark walnut finish and matte black accents.',
    dimensions: { length: 2400, width: 600, height: 2400 },
    innerColorHex: '#5b4033',
    outerDoorColorHex: '#1a1a1a', // If doors are closed
    innerMaterial: DARAZ_MATERIALS.find(m => m.id === 'walnut'),
    outerDoorMaterial: DARAZ_MATERIALS.find(m => m.id === 'matte-black'),
    doorStyle: 'open' as const,
    items: [
      { type: 'vertical-divider', name: 'Center Divider', price: 60, weight: 15, realWidth: 20, realHeight: 2300, x: 297.5, y: 12.5, colorHex: '#5b4033' },
      { type: 'hanger-rod', name: 'Left Hanger', price: 20, weight: 1, realWidth: 1100, realHeight: 20, x: 12.5, y: 50, colorHex: '#aaaaaa' },
      { type: 'hanger-rod', name: 'Right Top Hanger', price: 20, weight: 1, realWidth: 1100, realHeight: 20, x: 312.5, y: 50, colorHex: '#aaaaaa' },
      { type: 'hanger-rod', name: 'Right Bottom Hanger', price: 20, weight: 1, realWidth: 1100, realHeight: 20, x: 312.5, y: 300, colorHex: '#aaaaaa' },
      { type: 'drawer', name: 'Left Drawer Set', price: 250, weight: 20, realWidth: 1100, realHeight: 600, x: 12.5, y: 425, itemDepth: 500, colorHex: '#5b4033' }
    ]
  },
  {
    name: 'Ultimate Organizer 3-Zone',
    description: 'A comprehensive layout featuring a top loft for long-term storage, central hanging space, side shelves, and base drawers.',
    dimensions: { length: 1800, width: 600, height: 2400 },
    innerColorHex: '#f5f5dc',
    outerDoorColorHex: '#8b4513',
    innerMaterial: DARAZ_MATERIALS.find(m => m.id === 'white'),
    outerDoorMaterial: DARAZ_MATERIALS.find(m => m.id === 'walnut'),
    doorStyle: '3-door' as const,
    items: [
      // 1. Top Section (Long-Term & Seasonal Storage)
      { type: 'shelf', name: 'High-Level Loft Compartment', price: 60, weight: 8, realWidth: 1700, realHeight: 20, x: 12.5, y: 100, colorHex: '#f5f5dc' },
      
      // Vertical Divider splitting Middle and Lower sections - Now touches the floor
      { type: 'vertical-divider', name: 'Main Partition', price: 50, weight: 12, realWidth: 20, realHeight: 1980, x: 287.5, y: 105, colorHex: '#f5f5dc' },
      
      // 2. Middle Section (Primary Hanging & Daily Wear)
      { type: 'hanger-rod', name: 'Garment Hanging Zone', price: 30, weight: 2, realWidth: 1050, realHeight: 20, x: 12.5, y: 137.5, colorHex: '#aaaaaa' },
      
      // Side Stack Shelves (Right Side) - Evenly distributed
      { type: 'shelf', name: 'Side Stack Shelf 1', price: 30, weight: 4, realWidth: 550, realHeight: 20, x: 300, y: 235, colorHex: '#f5f5dc' },
      { type: 'shelf', name: 'Side Stack Shelf 2', price: 30, weight: 4, realWidth: 550, realHeight: 20, x: 300, y: 365, colorHex: '#f5f5dc' },
      { type: 'shelf', name: 'Drawer Top Cover', price: 30, weight: 4, realWidth: 550, realHeight: 20, x: 300, y: 495, colorHex: '#f5f5dc' },
      
      // 3. Lower Section (Drawers & Utility Compartments) - Stacked flush to the floor
      { type: 'drawer', name: 'Pull-Out Drawer Unit 1', price: 80, weight: 10, realWidth: 550, realHeight: 200, x: 300, y: 500, itemDepth: 500, colorHex: '#ffffff' },
      { type: 'drawer', name: 'Pull-Out Drawer Unit 2', price: 80, weight: 10, realWidth: 550, realHeight: 200, x: 300, y: 550, itemDepth: 500, colorHex: '#ffffff' },
      
      { type: 'shelf', name: 'Base Shoes / Bulk Storage', price: 40, weight: 5, realWidth: 1050, realHeight: 20, x: 12.5, y: 575, itemDepth: 550, colorHex: '#f5f5dc' }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class DarazConfigService {
  private initialState: DarazConfigState = {
    dimensions: DARAZ_THEMES[0].dimensions,
    innerMaterial: DARAZ_MATERIALS[2], // Oak
    outerDoorMaterial: DARAZ_MATERIALS[4], // White
    innerColorHex: DARAZ_THEMES[0].innerColorHex,
    outerDoorColorHex: DARAZ_THEMES[0].outerDoorColorHex,
    isDoorOpen: true, // Default to open so user can edit inside
    doorStyle: 'hinged',
    items: DARAZ_THEMES[0].items.map(item => ({...item, id: Math.random().toString(36).substring(2, 9)})) as DarazItem[],
    selectedUnit: 'mm'
  };

  private stateSubject = new BehaviorSubject<DarazConfigState>(this.initialState);
  state$ = this.stateSubject.asObservable();
  
  totalPrice$ = this.state$.pipe(map(() => this.calculateTotalPrice()));
  totalWeight$ = this.state$.pipe(map(() => this.calculateTotalWeight()));

  constructor() {}

  getCurrentState(): DarazConfigState {
    return this.stateSubject.value;
  }

  updateDimensions(dimensions: DarazDimensions) {
    this.stateSubject.next({ ...this.stateSubject.value, dimensions });
  }

  updateInnerMaterial(innerMaterial: MaterialOption) {
    this.stateSubject.next({ ...this.stateSubject.value, innerMaterial });
  }

  updateOuterDoorMaterial(outerDoorMaterial: MaterialOption) {
    this.stateSubject.next({ ...this.stateSubject.value, outerDoorMaterial });
  }

  updateInnerColor(hex: string) {
    this.stateSubject.next({ ...this.stateSubject.value, innerColorHex: hex });
  }

  updateOuterDoorColor(hex: string) {
    this.stateSubject.next({ ...this.stateSubject.value, outerDoorColorHex: hex });
  }

  updateDoorStyle(style: 'hinged' | '3-door' | 'sliding' | 'folding' | 'pivot' | 'push-to-open' | 'lift-up' | 'drop-down' | 'open') {
    this.stateSubject.next({ ...this.stateSubject.value, doorStyle: style });
  }

  toggleDoorState() {
    this.stateSubject.next({ ...this.stateSubject.value, isDoorOpen: !this.stateSubject.value.isDoorOpen });
  }

  updateUnit(unit: string) {
    this.stateSubject.next({ ...this.stateSubject.value, selectedUnit: unit });
  }

  addItem(item: Omit<DarazItem, 'id'>) {
    const newItem: DarazItem = { ...item, id: Math.random().toString(36).substring(2, 9) };
    const items = [...this.stateSubject.value.items, newItem];
    this.stateSubject.next({ ...this.stateSubject.value, items });
  }

  updateItemPosition(id: string, x: number, y: number) {
    const items = this.stateSubject.value.items.map(item =>
      item.id === id ? { ...item, x, y } : item
    );
    this.stateSubject.next({ ...this.stateSubject.value, items });
  }

  updateItemDimensions(id: string, width: number, height: number, itemDepth?: number) {
    const items = this.stateSubject.value.items.map(item =>
      item.id === id ? { ...item, width, height, itemDepth: itemDepth ?? item.itemDepth } : item
    );
    this.stateSubject.next({ ...this.stateSubject.value, items });
  }

  removeItem(id: string) {
    const items = this.stateSubject.value.items.filter(item => item.id !== id);
    this.stateSubject.next({ ...this.stateSubject.value, items });
  }

  loadTheme(statePatch: Partial<DarazConfigState>) {
    this.stateSubject.next({ ...this.stateSubject.value, ...statePatch });
  }

  calculateTotalWeight(): number {
    return this.stateSubject.value.items.reduce((acc, item) => acc + item.weight, 0);
  }

  calculateTotalPrice(): number {
    const state = this.stateSubject.value;
    const areaSqM = (state.dimensions.width / 1000) * (state.dimensions.length / 1000);
    const innerCost = areaSqM * state.innerMaterial.pricePerSqM * 2; // Assuming top/bottom and back
    const doorCost = (state.dimensions.length / 1000) * (state.dimensions.height / 1000) * state.outerDoorMaterial.pricePerSqM;
    const baseCost = 250; // Base hardware
    const itemsCost = state.items.reduce((acc, item) => acc + item.price, 0);
    return innerCost + doorCost + baseCost + itemsCost;
  }
}
