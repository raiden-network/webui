import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositWithdrawFormComponent } from './deposit-withdraw-form.component';

describe('DepositWithdrawFormComponent', () => {
    let component: DepositWithdrawFormComponent;
    let fixture: ComponentFixture<DepositWithdrawFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DepositWithdrawFormComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DepositWithdrawFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
