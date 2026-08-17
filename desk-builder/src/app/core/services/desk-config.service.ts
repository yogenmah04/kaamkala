import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export interface DeskDimensions {
  width: number; // mm
  height: number; // mm
  depth: number; // mm
}

export interface MaterialOption {
  id: string;
  name: string;
  pricePerSqM: number;
}

export interface CanvasItem {
  id: string;
  type: string; // 'monitor', 'shelf', 'accessory', etc.
  name: string;
  x: number;
  y: number;
  price: number;
  weight: number; // kg
  width?: number; // Optional custom width for rendering (px)
  height?: number; // Optional custom height for rendering (px)
  itemDepth?: number; // Optional custom depth/breadth for 3D rendering (px)
  colorHex?: string; // Optional custom color to contrast with background
}

export interface DeskConfigState {
  dimensions: DeskDimensions;
  cabinetMaterial: MaterialOption;
  panelMaterial: MaterialOption;
  cabinetColorHex: string;
  panelColorHex: string;
  isDeskOpen: boolean;
  items: CanvasItem[];
}

export const MATERIALS: MaterialOption[] = [
  { id: 'matte-black', name: 'Matte Black', pricePerSqM: 50 },
  { id: 'walnut', name: 'Walnut Wood Grain', pricePerSqM: 120 },
  { id: 'oak', name: 'Oak Wood Grain', pricePerSqM: 100 },
  { id: 'slate-grey', name: 'Slate Grey', pricePerSqM: 60 },
  { id: 'navy-blue', name: 'Navy Blue', pricePerSqM: 65 },
  { id: 'white', name: 'Pure White', pricePerSqM: 40 },
  { id: 'custom-paint', name: 'Custom Paint', pricePerSqM: 80 }
];

@Injectable({
  providedIn: 'root'
})
export class DeskConfigService {
  private initialState: DeskConfigState = {
    dimensions: { width: 1200, height: 800, depth: 200 },
    cabinetMaterial: MATERIALS[0], // Matte Black default
    panelMaterial: MATERIALS[1], // Walnut default
    cabinetColorHex: '#222222',
    panelColorHex: '#5c4033',
    isDeskOpen: true,
    items: []
  };

  private stateSubject = new BehaviorSubject<DeskConfigState>(this.initialState);
  state$ = this.stateSubject.asObservable();
  
  totalPrice$ = this.state$.pipe(map(() => this.calculateTotalPrice()));
  totalWeight$ = this.state$.pipe(map(() => this.calculateTotalWeight()));

  constructor() {}

  updateDimensions(dimensions: DeskDimensions) {
    this.stateSubject.next({ ...this.stateSubject.value, dimensions });
  }

  updateCabinetMaterial(cabinetMaterial: MaterialOption) {
    this.stateSubject.next({ ...this.stateSubject.value, cabinetMaterial });
  }

  updatePanelMaterial(panelMaterial: MaterialOption) {
    this.stateSubject.next({ ...this.stateSubject.value, panelMaterial });
  }

  updateCabinetColor(hex: string) {
    this.stateSubject.next({ ...this.stateSubject.value, cabinetColorHex: hex });
  }

  updatePanelColor(hex: string) {
    this.stateSubject.next({ ...this.stateSubject.value, panelColorHex: hex });
  }

  toggleDeskState() {
    this.stateSubject.next({ ...this.stateSubject.value, isDeskOpen: !this.stateSubject.value.isDeskOpen });
  }

  addItem(item: Omit<CanvasItem, 'id'>) {
    const newItem: CanvasItem = { ...item, id: Math.random().toString(36).substring(2, 9) };
    const items = [...this.stateSubject.value.items, newItem];
    this.stateSubject.next({ ...this.stateSubject.value, items });
  }

  updateItemPosition(id: string, x: number, y: number) {
    const items = this.stateSubject.value.items.map(item =>
      item.id === id ? { ...item, x, y } : item
    );
    this.stateSubject.next({ ...this.stateSubject.value, items });
  }

  removeItem(id: string) {
    const items = this.stateSubject.value.items.filter(item => item.id !== id);
    this.stateSubject.next({ ...this.stateSubject.value, items });
  }

  loadTheme(statePatch: Partial<DeskConfigState>) {
    this.stateSubject.next({ ...this.stateSubject.value, ...statePatch });
  }

  calculateTotalWeight(): number {
    return this.stateSubject.value.items.reduce((acc, item) => acc + item.weight, 0);
  }

  calculateTotalPrice(): number {
    const state = this.stateSubject.value;
    const areaSqM = (state.dimensions.width / 1000) * (state.dimensions.height / 1000);
    const cabinetCost = areaSqM * state.cabinetMaterial.pricePerSqM;
    const panelCost = areaSqM * state.panelMaterial.pricePerSqM;
    const baseCost = 150; // Base hardware cost
    const itemsCost = state.items.reduce((acc, item) => acc + item.price, 0);
    return cabinetCost + panelCost + baseCost + itemsCost;
  }
}
