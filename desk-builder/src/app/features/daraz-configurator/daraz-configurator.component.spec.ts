import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DarazConfiguratorComponent } from './daraz-configurator.component';

describe('DarazConfiguratorComponent', () => {
  let component: DarazConfiguratorComponent;
  let fixture: ComponentFixture<DarazConfiguratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DarazConfiguratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DarazConfiguratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
