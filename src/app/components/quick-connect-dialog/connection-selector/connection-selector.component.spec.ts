import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionSelectorComponent } from './connection-selector.component';

fdescribe('ConnectionSelectorComponent', () => {
    let component: ConnectionSelectorComponent;
    let fixture: ComponentFixture<ConnectionSelectorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConnectionSelectorComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConnectionSelectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
