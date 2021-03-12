import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDepositDialogComponent } from './user-deposit-dialog.component';

describe('UserDepositDialogComponent', () => {
    let component: UserDepositDialogComponent;
    let fixture: ComponentFixture<UserDepositDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UserDepositDialogComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(UserDepositDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
