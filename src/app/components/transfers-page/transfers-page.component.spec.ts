import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransfersPageComponent } from './transfers-page.component';

describe('TransfersPageComponent', () => {
    let component: TransfersPageComponent;
    let fixture: ComponentFixture<TransfersPageComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TransfersPageComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TransfersPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
