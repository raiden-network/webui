import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditContactDialogComponent } from './add-edit-contact-dialog.component';

describe('AddEditContactDialogComponent', () => {
    let component: AddEditContactDialogComponent;
    let fixture: ComponentFixture<AddEditContactDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AddEditContactDialogComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddEditContactDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
