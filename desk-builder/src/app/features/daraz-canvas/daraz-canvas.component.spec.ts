import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DarazCanvasComponent } from './daraz-canvas.component';

describe('DarazCanvasComponent', () => {
  let component: DarazCanvasComponent;
  let fixture: ComponentFixture<DarazCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DarazCanvasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DarazCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
