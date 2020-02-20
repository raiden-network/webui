import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TokenComponent } from './token.component';
import { RaidenService } from '../../services/raiden.service';
import { TokenPollingService } from '../../services/token-polling.service';
import { TestProviders } from '../../../testing/test-providers';
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { createToken, createAddress } from '../../../testing/test-data';
import { By } from '@angular/platform-browser';
import { clickElement } from '../../../testing/interaction-helper';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import { MatDialog } from '@angular/material/dialog';
import {
    PaymentDialogComponent,
    PaymentDialogPayload
} from '../payment-dialog/payment-dialog.component';
import BigNumber from 'bignumber.js';
import { of } from 'rxjs';
import {
    ConnectionManagerDialogPayload,
    ConnectionManagerDialogComponent
} from '../connection-manager-dialog/connection-manager-dialog.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
    ConfirmationDialogPayload,
    ConfirmationDialogComponent
} from '../confirmation-dialog/confirmation-dialog.component';
import { ClipboardModule } from 'ngx-clipboard';

describe('TokenComponent', () => {
    let component: TokenComponent;
    let fixture: ComponentFixture<TokenComponent>;

    let dialog: MockMatDialog;
    let raidenService: RaidenService;
    const token = createToken();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TokenComponent, DecimalPipe, DisplayDecimalsPipe],
            providers: [
                RaidenService,
                TokenPollingService,
                TestProviders.MockRaidenConfigProvider(),
                PendingTransferPollingService,
                TestProviders.MockMatDialog(),
                TestProviders.AddressBookStubProvider()
            ],
            imports: [
                RaidenIconsModule,
                MaterialComponentsModule,
                HttpClientTestingModule,
                NoopAnimationsModule,
                ClipboardModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TokenComponent);
        component = fixture.componentInstance;
        component.selected = true;

        dialog = (<unknown>TestBed.inject(MatDialog)) as MockMatDialog;
        raidenService = TestBed.inject(RaidenService);
    });

    describe('as all networks view', () => {
        beforeEach(() => {
            component.allNetworksView = true;
            component.openChannels = 1;
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should open payment dialog with no token network selected', () => {
            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            const dialogResult: PaymentDialogPayload = {
                tokenAddress: token.address,
                targetAddress: createAddress(),
                amount: new BigNumber(10)
            };
            dialog.returns = () => dialogResult;
            const initiatePaymentSpy = spyOn(
                raidenService,
                'initiatePayment'
            ).and.returnValue(of(null));
            clickElement(fixture.debugElement, '#transfer');

            const payload: PaymentDialogPayload = {
                tokenAddress: '',
                targetAddress: '',
                amount: undefined
            };
            expect(dialogSpy).toHaveBeenCalledTimes(1);
            expect(dialogSpy).toHaveBeenCalledWith(PaymentDialogComponent, {
                data: payload,
                width: '360px'
            });
            expect(initiatePaymentSpy).toHaveBeenCalledTimes(1);
            expect(initiatePaymentSpy).toHaveBeenCalledWith(
                dialogResult.tokenAddress,
                dialogResult.targetAddress,
                dialogResult.amount
            );
        });

        it('should not have a quick connect button', () => {
            const button = fixture.debugElement.query(By.css('#quick-connect'));
            expect(button).toBeFalsy();
        });

        it('should not have a options menu', () => {
            const button = fixture.debugElement.query(By.css('#options'));
            expect(button).toBeFalsy();
        });
    });

    describe('as token view', () => {
        beforeEach(() => {
            component.token = token;
            component.openChannels = 1;
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should open payment dialog with token network selected', () => {
            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            const dialogResult: PaymentDialogPayload = {
                tokenAddress: token.address,
                targetAddress: createAddress(),
                amount: new BigNumber(10)
            };
            dialog.returns = () => dialogResult;
            const initiatePaymentSpy = spyOn(
                raidenService,
                'initiatePayment'
            ).and.returnValue(of(null));
            clickElement(fixture.debugElement, '#transfer');

            const payload: PaymentDialogPayload = {
                tokenAddress: token.address,
                targetAddress: '',
                amount: undefined
            };
            expect(dialogSpy).toHaveBeenCalledTimes(1);
            expect(dialogSpy).toHaveBeenCalledWith(PaymentDialogComponent, {
                data: payload,
                width: '360px'
            });
            expect(initiatePaymentSpy).toHaveBeenCalledTimes(1);
            expect(initiatePaymentSpy).toHaveBeenCalledWith(
                dialogResult.tokenAddress,
                dialogResult.targetAddress,
                dialogResult.amount
            );
        });

        it('should not call the raiden service if payment is cancelled', () => {
            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            dialog.returns = () => null;
            const initiatePaymentSpy = spyOn(
                raidenService,
                'initiatePayment'
            ).and.returnValue(of(null));
            clickElement(fixture.debugElement, '#transfer');

            expect(dialogSpy).toHaveBeenCalledTimes(1);
            expect(initiatePaymentSpy).toHaveBeenCalledTimes(0);
        });

        it('should open quick connect dialog with token network selected', () => {
            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            const dialogResult: ConnectionManagerDialogPayload = {
                token: token,
                funds: new BigNumber(10)
            };
            dialog.returns = () => dialogResult;
            const connectSpy = spyOn(
                raidenService,
                'connectTokenNetwork'
            ).and.returnValue(of(null));
            clickElement(fixture.debugElement, '#quick-connect');

            const payload: ConnectionManagerDialogPayload = {
                token: token,
                funds: undefined
            };
            expect(dialogSpy).toHaveBeenCalledTimes(1);
            expect(dialogSpy).toHaveBeenCalledWith(
                ConnectionManagerDialogComponent,
                {
                    data: payload,
                    width: '360px'
                }
            );
            expect(connectSpy).toHaveBeenCalledTimes(1);
            expect(connectSpy).toHaveBeenCalledWith(
                dialogResult.funds,
                dialogResult.token.address,
                true
            );
        });

        it('should not call the raiden service if quick connect is cancelled', () => {
            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            dialog.returns = () => null;
            const connectSpy = spyOn(
                raidenService,
                'connectTokenNetwork'
            ).and.returnValue(of(null));
            clickElement(fixture.debugElement, '#quick-connect');

            expect(dialogSpy).toHaveBeenCalledTimes(1);
            expect(connectSpy).toHaveBeenCalledTimes(0);
        });

        it('should add funds if token network is already connected', () => {
            const connectedToken = createToken({
                connected: {
                    funds: new BigNumber(20),
                    sum_deposits: new BigNumber(10),
                    channels: 1
                }
            });
            component.token = connectedToken;
            fixture.detectChanges();

            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            const dialogResult: ConnectionManagerDialogPayload = {
                token: connectedToken,
                funds: new BigNumber(10)
            };
            dialog.returns = () => dialogResult;
            const connectSpy = spyOn(
                raidenService,
                'connectTokenNetwork'
            ).and.returnValue(of(null));
            clickElement(fixture.debugElement, '#quick-connect');

            const payload: ConnectionManagerDialogPayload = {
                token: connectedToken,
                funds: undefined
            };
            expect(dialogSpy).toHaveBeenCalledTimes(1);
            expect(dialogSpy).toHaveBeenCalledWith(
                ConnectionManagerDialogComponent,
                {
                    data: payload,
                    width: '360px'
                }
            );
            expect(connectSpy).toHaveBeenCalledTimes(1);
            expect(connectSpy).toHaveBeenCalledWith(
                new BigNumber(30),
                dialogResult.token.address,
                false
            );
        });

        it('should mint 0.5 tokens when token has 18 decimals', () => {
            component.onMainnet = false;
            clickElement(fixture.debugElement, '#options');
            fixture.detectChanges();

            const mintSpy = spyOn(raidenService, 'mintToken').and.returnValue(
                of(null)
            );
            clickElement(fixture.debugElement, '#mint');
            expect(mintSpy).toHaveBeenCalledTimes(1);
            expect(mintSpy).toHaveBeenCalledWith(
                token,
                raidenService.raidenAddress,
                new BigNumber(500000000000000000)
            );
        });

        it('should mint 5000 tokens when token has no decimals', () => {
            component.onMainnet = false;
            const noDecimalsToken = createToken({ decimals: 0 });
            component.token = noDecimalsToken;
            fixture.detectChanges();

            clickElement(fixture.debugElement, '#options');
            fixture.detectChanges();

            const mintSpy = spyOn(raidenService, 'mintToken').and.returnValue(
                of(null)
            );
            clickElement(fixture.debugElement, '#mint');
            expect(mintSpy).toHaveBeenCalledTimes(1);
            expect(mintSpy).toHaveBeenCalledWith(
                noDecimalsToken,
                raidenService.raidenAddress,
                new BigNumber(5000)
            );
        });

        it('should open leave dialog', () => {
            clickElement(fixture.debugElement, '#options');
            fixture.detectChanges();

            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            const leaveSpy = spyOn(
                raidenService,
                'leaveTokenNetwork'
            ).and.returnValue(of(null));
            clickElement(fixture.debugElement, '#leave');

            const payload: ConfirmationDialogPayload = {
                title: 'Leave Token Network',
                message: `Are you sure you want to close and settle all ${
                    token.symbol
                } channels in ${token.name} network?`
            };
            expect(dialogSpy).toHaveBeenCalledTimes(1);
            expect(dialogSpy).toHaveBeenCalledWith(
                ConfirmationDialogComponent,
                {
                    data: payload,
                    width: '360px'
                }
            );
            expect(leaveSpy).toHaveBeenCalledTimes(1);
            expect(leaveSpy).toHaveBeenCalledWith(token);
        });

        it('should not leave token network if dialog is cancelled', () => {
            clickElement(fixture.debugElement, '#options');
            fixture.detectChanges();

            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            dialog.returns = () => null;
            const leaveSpy = spyOn(
                raidenService,
                'leaveTokenNetwork'
            ).and.returnValue(of(null));
            clickElement(fixture.debugElement, '#leave');

            expect(dialogSpy).toHaveBeenCalledTimes(1);
            expect(leaveSpy).toHaveBeenCalledTimes(0);
        });
    });
});
