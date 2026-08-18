import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguratorComponent } from './features/configurator/configurator.component';
import { CanvasComponent } from './features/canvas/canvas.component';
import { SidebarComponent } from './features/sidebar/sidebar.component';
import { BedConfiguratorComponent } from './features/bed-configurator/bed-configurator.component';
import { BedCanvasComponent } from './features/bed-canvas/bed-canvas.component';
import { DarazConfiguratorComponent } from './features/daraz-configurator/daraz-configurator.component';
import { DarazCanvasComponent } from './features/daraz-canvas/daraz-canvas.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ConfiguratorComponent, CanvasComponent, SidebarComponent, BedConfiguratorComponent, BedCanvasComponent, DarazConfiguratorComponent, DarazCanvasComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'desk-builder';
  activeAppMode: 'desk' | 'bed' | 'daraz' = 'desk';
  activeMobileTab: 'config' | 'preview' = 'config';

  setMobileTab(tab: 'config' | 'preview') {
    this.activeMobileTab = tab;
  }

  setAppMode(mode: 'desk' | 'bed' | 'daraz') {
    this.activeAppMode = mode;
  }
}
