import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguratorComponent } from './features/configurator/configurator.component';
import { CanvasComponent } from './features/canvas/canvas.component';
import { SidebarComponent } from './features/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ConfiguratorComponent, CanvasComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'desk-builder';
  activeMobileTab: 'config' | 'preview' = 'config';

  setMobileTab(tab: 'config' | 'preview') {
    this.activeMobileTab = tab;
  }
}
