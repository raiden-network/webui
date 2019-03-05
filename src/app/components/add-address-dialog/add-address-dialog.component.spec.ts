import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAddressDialogComponent } from './add-address-dialog.component';

describe('AddAddressDialogComponent', () => {
    let component: AddAddressDialogComponent;
    let fixture: ComponentFixture<AddAddressDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AddAddressDialogComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddAddressDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
