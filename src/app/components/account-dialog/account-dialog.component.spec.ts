import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountDialogComponent } from './account-dialog.component';

describe('AccountDialogComponent', () => {
    let component: AccountDialogComponent;
    let fixture: ComponentFixture<AccountDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AccountDialogComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AccountDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // it('should have a faucet button when network has a faucet', () => {
    //     expect(
    //         fixture.debugElement.query(By.css('#faucet-button'))
    //     ).toBeTruthy();
    // });

    // it('should not have a faucet button when network does not have a faucet', () => {
    //     networkSubject.next(createNetworkMock({ faucet: null }));
    //     fixture.detectChanges();
    //     expect(
    //         fixture.debugElement.query(By.css('#faucet-button'))
    //     ).toBeFalsy();
    // });

    // it('should insert the address correctly into the href attribute of the faucet button', () => {
    //     const href = fixture.debugElement
    //         .query(By.css('#faucet-button'))
    //         .nativeElement.getAttribute('href');
    //     expect(href).toBe(`http://faucet.test/?${raidenAddress}`);
    // });
});
