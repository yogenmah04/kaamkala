import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeskConfigService } from '../../core/services/desk-config.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  constructor(public deskConfig: DeskConfigService) {}

  saveDesign() {
    this.deskConfig.state$.subscribe(state => {
      const payload = {
        dimensions: state.dimensions,
        cabinetMaterial: state.cabinetMaterial.id,
        panelMaterial: state.panelMaterial.id,
        items: state.items.map(item => ({
          type: item.type,
          name: item.name,
          position: { x: item.x, y: item.y },
          weight: item.weight
        })),
        totalWeight: this.deskConfig.calculateTotalWeight(),
        totalPrice: this.deskConfig.calculateTotalPrice(),
        wallMountingType: this.deskConfig.calculateTotalWeight() > 20 ? 'heavy-duty' : 'standard'
      };
      
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'desk-config.json';
      a.click();
      window.URL.revokeObjectURL(url);
    }).unsubscribe();
  }
}
