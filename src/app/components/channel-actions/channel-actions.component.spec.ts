import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelActionsComponent } from './channel-actions.component';
import { By } from '@angular/platform-browser';
import { DepositMode } from '../../utils/helpers';
import BigNumber from 'bignumber.js';

describe('ChannelActionsComponent', () => {
    let component: ChannelActionsComponent;
    let fixture: ComponentFixture<ChannelActionsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ChannelActionsComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChannelActionsComponent);
        component = fixture.componentInstance;
        component.channel = {
            channel_identifier: new BigNumber(1),
            balance: new BigNumber(1),
            partner_address: '',
            reveal_timeout: new BigNumber(100),
            settle_timeout: new BigNumber(500),
            state: '',
            token_address: '',
            total_deposit: new BigNumber(10),
            total_withdraw: new BigNumber(10),
            userToken: null
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fire a withdraw event when the withdraw button is clicked', done => {
        const element = fixture.debugElement.query(By.css('#withdraw-button'));

        component.openDepositDialog.subscribe(val => {
            expect(val).toEqual(DepositMode.WITHDRAW);
            done();
        });
        element.triggerEventHandler('click', {});
    });

    it('should fire a deposit event when the deposit button is clicked ', done => {
        const element = fixture.debugElement.query(By.css('#deposit-button'));

        component.openDepositDialog.subscribe(val => {
            expect(val).toEqual(DepositMode.DEPOSIT);
            done();
        });
        element.triggerEventHandler('click', {});
    });

    it('should fire a close event when the close button is clicked ', done => {
        const element = fixture.debugElement.query(By.css('#close-button'));

        component.openCloseDialog.subscribe(val => {
            expect(val).toEqual(true);
            done();
        });
        element.triggerEventHandler('click', {});
    });

    it('should fire a pay event when the pay button is clicked ', done => {
        const element = fixture.debugElement.query(By.css('#pay-button'));

        component.openPayDialog.subscribe(val => {
            expect(val).toEqual(true);
            done();
        });
        element.triggerEventHandler('click', {});
    });
});
