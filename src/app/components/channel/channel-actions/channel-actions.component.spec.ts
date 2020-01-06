import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ChannelActionsComponent } from './channel-actions.component';
import { By } from '@angular/platform-browser';
import { DepositMode } from '../../../utils/helpers';
import BigNumber from 'bignumber.js';
import { TestProviders } from '../../../../testing/test-providers';
import { MatDialog } from '@angular/material/dialog';
import { MockMatDialog } from '../../../../testing/mock-mat-dialog';
import { DepositWithdrawDialogComponent } from '../../deposit-withdraw-dialog/deposit-withdraw-dialog.component';
import { UserToken } from '../../../models/usertoken';
import { RaidenService } from '../../../services/raiden.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { createChannel } from '../../../../testing/test-data';
import { PaymentDialogComponent } from '../../payment-dialog/payment-dialog.component';
import { of } from 'rxjs';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('ChannelActionsComponent', () => {
    let component: ChannelActionsComponent;
    let fixture: ComponentFixture<ChannelActionsComponent>;
    let raidenService: RaidenService;

    const token: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 18,
        balance: new BigNumber(20)
    };

    const channel = createChannel({
        id: new BigNumber(1),
        balance: new BigNumber(1),
        totalDeposit: new BigNumber(10),
        totalWithdraw: new BigNumber(10)
    });
    channel.userToken = token;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ChannelActionsComponent],
            providers: [
                TestProviders.MockMatDialog(),
                RaidenService,
                TestProviders.MockRaidenConfigProvider()
            ],
            imports: [HttpClientTestingModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChannelActionsComponent);
        component = fixture.componentInstance;
        component.channel = channel;
        raidenService = TestBed.get(RaidenService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open the pay dialog when the pay button is clicked', () => {
        const dialog = TestBed.get(MatDialog) as MockMatDialog;
        dialog.returns = () => {
            return {
                tokenAddress: token.address,
                targetAddress: channel.partner_address,
                amount: new BigNumber(100),
                paymentIdentifier: undefined
            };
        };
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const paySpy = spyOn(raidenService, 'initiatePayment').and.returnValue(
            of(null)
        );

        const element = fixture.debugElement.query(By.css('#pay-button'));
        element.triggerEventHandler('click', {});

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(PaymentDialogComponent, {
            data: {
                tokenAddress: token.address,
                targetAddress: channel.partner_address,
                amount: new BigNumber(0),
                paymentIdentifier: null
            }
        });
        expect(paySpy).toHaveBeenCalledTimes(1);
        expect(paySpy).toHaveBeenCalledWith(
            token.address,
            channel.partner_address,
            new BigNumber(100),
            undefined
        );
    });

    it('should open the deposit dialog when the deposit button is clicked', () => {
        const dialog = TestBed.get(MatDialog) as MockMatDialog;
        dialog.returns = () => {
            return { tokenAmount: new BigNumber(100) };
        };
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const depositSpy = spyOn(
            raidenService,
            'modifyDeposit'
        ).and.returnValue(of(null));

        const element = fixture.debugElement.query(By.css('#deposit-button'));
        element.triggerEventHandler('click', {});

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(DepositWithdrawDialogComponent, {
            data: {
                decimals: token.decimals,
                depositMode: DepositMode.DEPOSIT
            }
        });
        expect(depositSpy).toHaveBeenCalledTimes(1);
        expect(depositSpy).toHaveBeenCalledWith(
            channel.token_address,
            channel.partner_address,
            new BigNumber(100),
            DepositMode.DEPOSIT
        );
    });

    it('should open the withdraw dialog when the withdraw button is clicked', () => {
        const dialog = TestBed.get(MatDialog) as MockMatDialog;
        dialog.returns = () => {
            return { tokenAmount: new BigNumber(100) };
        };
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const withdrawSpy = spyOn(
            raidenService,
            'modifyDeposit'
        ).and.returnValue(of(null));

        const element = fixture.debugElement.query(By.css('#withdraw-button'));
        element.triggerEventHandler('click', {});

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(DepositWithdrawDialogComponent, {
            data: {
                decimals: token.decimals,
                depositMode: DepositMode.WITHDRAW
            }
        });
        expect(withdrawSpy).toHaveBeenCalledTimes(1);
        expect(withdrawSpy).toHaveBeenCalledWith(
            channel.token_address,
            channel.partner_address,
            new BigNumber(100),
            DepositMode.WITHDRAW
        );
    });

    it('should open the close dialog when the close button is clicked', () => {
        const dialog = TestBed.get(MatDialog) as MockMatDialog;
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const closeSpy = spyOn(raidenService, 'closeChannel').and.returnValue(
            of(null)
        );

        const element = fixture.debugElement.query(By.css('#close-button'));
        element.triggerEventHandler('click', {});

        const confirmationPayload = {
            title: 'Close Channel',
            message: `Are you sure you want to close channel ${
                channel.channel_identifier
            } with <strong>${channel.partner_address}</strong> on <strong>${
                token.name
            }<strong/> (${token.address})?`
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(ConfirmationDialogComponent, {
            data: confirmationPayload
        });
        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith(
            channel.token_address,
            channel.partner_address
        );
    });
});
