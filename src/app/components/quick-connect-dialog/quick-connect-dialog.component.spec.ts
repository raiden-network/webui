import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickConnectDialogComponent } from './quick-connect-dialog.component';

describe('QuickConnectDialogComponent', () => {
    let component: QuickConnectDialogComponent;
    let fixture: ComponentFixture<QuickConnectDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [QuickConnectDialogComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuickConnectDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
