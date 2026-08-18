import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export interface BedDimensions {
  length: number; // mm
  width: number; // mm
  height: number; // mm (clearance/frame height)
}

export interface BedMaterialOption {
  id: string;
  name: string;
  pricePerSqM: number;
}

export interface BedItem {
  id: string;
  type: string; // 'drawer', 'headboard', 'hardware', 'led'
  name: string;
  x: number;
  y: number;
  price: number;
  weight: number; // kg
  width?: number; // Optional custom width for rendering (px)
  height?: number; // Optional custom height for rendering (px)
  itemDepth?: number; // Optional custom depth for 3D rendering (px)
  colorHex?: string; // Optional custom color to contrast with background
}

export interface BedConfigState {
  dimensions: BedDimensions;
  frameMaterial: BedMaterialOption;
  headboardMaterial: BedMaterialOption;
  frameColorHex: string;
  headboardColorHex: string;
  isStorageOpen: boolean;
  items: BedItem[];
}

export const BED_MATERIALS: BedMaterialOption[] = [
  { id: 'matte-black', name: 'Matte Black', pricePerSqM: 50 },
  { id: 'walnut', name: 'Walnut Wood Grain', pricePerSqM: 120 },
  { id: 'oak', name: 'Oak Wood Grain', pricePerSqM: 100 },
  { id: 'slate-grey', name: 'Slate Grey', pricePerSqM: 60 },
  { id: 'white', name: 'Pure White', pricePerSqM: 40 },
  { id: 'upholstered-grey', name: 'Grey Linen Upholstery', pricePerSqM: 150 },
  { id: 'upholstered-beige', name: 'Beige Velvet Upholstery', pricePerSqM: 180 }
];

export const BED_THEMES = [
  {
    name: 'Minimalist Platform',
    description: 'A sleek, low-profile bed focusing on clean lines and natural oak.',
    dimensions: { length: 2000, width: 1400, height: 300 }, // Standard Double
    frameColorHex: '#d2b48c',
    headboardColorHex: '#d2b48c',
    frameMaterial: BED_MATERIALS.find(m => m.id === 'oak'),
    headboardMaterial: BED_MATERIALS.find(m => m.id === 'oak'),
    items: [
      { type: 'headboard', name: 'Minimalist Headboard', price: 100, weight: 10, realWidth: 1400, realHeight: 500, x: 0, y: 0 }
    ]
  },
  {
    name: 'Storage King',
    description: 'Massive king size with built-in under-bed storage drawers.',
    dimensions: { length: 2000, width: 1800, height: 450 }, // King
    frameColorHex: '#5b4033',
    headboardColorHex: '#1a1a1a',
    frameMaterial: BED_MATERIALS.find(m => m.id === 'walnut'),
    headboardMaterial: BED_MATERIALS.find(m => m.id === 'matte-black'),
    items: [
      { type: 'headboard', name: 'Tall Tufted Headboard', price: 300, weight: 25, realWidth: 1800, realHeight: 1200, x: 0, y: 0 },
      { type: 'drawer', name: 'Left Storage Drawer', price: 150, weight: 12, realWidth: 900, realHeight: 300, x: 50, y: 400 },
      { type: 'drawer', name: 'Right Storage Drawer', price: 150, weight: 12, realWidth: 900, realHeight: 300, x: 1050, y: 400 }
    ]
  },
  {
    name: 'Sci-Fi Float',
    description: 'Futuristic floating design using gravitic nodes and underglow LEDs.',
    dimensions: { length: 2000, width: 1600, height: 350 }, // Queen
    frameColorHex: '#f5f5f5',
    headboardColorHex: '#f5f5f5',
    frameMaterial: BED_MATERIALS.find(m => m.id === 'white'),
    headboardMaterial: BED_MATERIALS.find(m => m.id === 'white'),
    items: [
      { type: 'headboard', name: 'Integrated Backlit Headboard', price: 250, weight: 15, realWidth: 1600, realHeight: 600, x: 0, y: 0 },
      { type: 'led', name: 'Base Underglow LED Strip', price: 60, weight: 1, realWidth: 1500, realHeight: 20, x: 50, y: 1900, colorHex: '#00ffff' },
      { type: 'hardware', name: 'Gravitic Levitation Node', price: 500, weight: 5, realWidth: 100, realHeight: 100, x: 750, y: 1000, colorHex: '#00ffff' }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class BedConfigService {
  private initialState: BedConfigState = {
    dimensions: BED_THEMES[0].dimensions,
    frameMaterial: BED_MATERIALS[2], // Oak
    headboardMaterial: BED_MATERIALS[2], // Oak
    frameColorHex: BED_THEMES[0].frameColorHex,
    headboardColorHex: BED_THEMES[0].headboardColorHex,
    isStorageOpen: false,
    items: BED_THEMES[0].items as any[]
  };

  private stateSubject = new BehaviorSubject<BedConfigState>(this.initialState);
  state$ = this.stateSubject.asObservable();
  
  totalPrice$ = this.state$.pipe(map(() => this.calculateTotalPrice()));
  totalWeight$ = this.state$.pipe(map(() => this.calculateTotalWeight()));

  constructor() {}

  updateDimensions(dimensions: BedDimensions) {
    this.stateSubject.next({ ...this.stateSubject.value, dimensions });
  }

  updateFrameMaterial(frameMaterial: BedMaterialOption) {
    this.stateSubject.next({ ...this.stateSubject.value, frameMaterial });
  }

  updateHeadboardMaterial(headboardMaterial: BedMaterialOption) {
    this.stateSubject.next({ ...this.stateSubject.value, headboardMaterial });
  }

  updateFrameColor(hex: string) {
    this.stateSubject.next({ ...this.stateSubject.value, frameColorHex: hex });
  }

  updateHeadboardColor(hex: string) {
    this.stateSubject.next({ ...this.stateSubject.value, headboardColorHex: hex });
  }

  toggleStorageState() {
    this.stateSubject.next({ ...this.stateSubject.value, isStorageOpen: !this.stateSubject.value.isStorageOpen });
  }

  addItem(item: Omit<BedItem, 'id'>) {
    const newItem: BedItem = { ...item, id: Math.random().toString(36).substring(2, 9) };
    const items = [...this.stateSubject.value.items, newItem];
    this.stateSubject.next({ ...this.stateSubject.value, items });
  }

  updateItemPosition(id: string, x: number, y: number) {
    const items = this.stateSubject.value.items.map(item =>
      item.id === id ? { ...item, x, y } : item
    );
    this.stateSubject.next({ ...this.stateSubject.value, items });
  }

  updateItemDimensions(id: string, width: number, height: number) {
    const items = this.stateSubject.value.items.map(item =>
      item.id === id ? { ...item, width, height } : item
    );
    this.stateSubject.next({ ...this.stateSubject.value, items });
  }

  removeItem(id: string) {
    const items = this.stateSubject.value.items.filter(item => item.id !== id);
    this.stateSubject.next({ ...this.stateSubject.value, items });
  }

  loadTheme(statePatch: Partial<BedConfigState>) {
    this.stateSubject.next({ ...this.stateSubject.value, ...statePatch });
  }

  calculateTotalWeight(): number {
    return this.stateSubject.value.items.reduce((acc, item) => acc + item.weight, 0);
  }

  calculateTotalPrice(): number {
    const state = this.stateSubject.value;
    const areaSqM = (state.dimensions.width / 1000) * (state.dimensions.length / 1000);
    const frameCost = areaSqM * state.frameMaterial.pricePerSqM;
    const headboardCost = (state.dimensions.width / 1000) * state.headboardMaterial.pricePerSqM; // Simpler calculation for headboard based on width
    const baseCost = 250; // Base bed hardware cost
    const itemsCost = state.items.reduce((acc, item) => acc + item.price, 0);
    return frameCost + headboardCost + baseCost + itemsCost;
  }
}
