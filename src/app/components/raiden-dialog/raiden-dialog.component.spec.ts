import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RaidenDialogComponent } from './raiden-dialog.component';

describe('RaidenDialogComponent', () => {
    let component: RaidenDialogComponent;
    let fixture: ComponentFixture<RaidenDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [RaidenDialogComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(RaidenDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
