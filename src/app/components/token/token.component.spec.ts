import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
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
import {
    createToken,
    createAddress,
    createTestChannels,
    createTestTokens,
} from '../../../testing/test-data';
import { By } from '@angular/platform-browser';
import {
    clickElement,
    mockOpenMatSelect,
    mockMatSelectByIndex,
} from '../../../testing/interaction-helper';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import { MatDialog } from '@angular/material/dialog';
import {
    PaymentDialogComponent,
    PaymentDialogPayload,
} from '../payment-dialog/payment-dialog.component';
import BigNumber from 'bignumber.js';
import { of, BehaviorSubject } from 'rxjs';
import {
    ConnectionManagerDialogPayload,
    ConnectionManagerDialogComponent,
} from '../connection-manager-dialog/connection-manager-dialog.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
    ConfirmationDialogPayload,
    ConfirmationDialogComponent,
} from '../confirmation-dialog/confirmation-dialog.component';
import { ClipboardModule } from 'ngx-clipboard';
import { SelectedTokenService } from '../../services/selected-token.service';
import { Channel } from '../../models/channel';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { stub } from '../../../testing/stub';
import { BalanceWithSymbolComponent } from '../balance-with-symbol/balance-with-symbol.component';
import { TokenNetworkSelectorComponent } from '../token-network-selector/token-network-selector.component';

describe('TokenComponent', () => {
    let component: TokenComponent;
    let fixture: ComponentFixture<TokenComponent>;

    let dialog: MockMatDialog;
    let raidenService: RaidenService;

    const tokens = createTestTokens(6);
    const connectedToken = tokens[0];
    const unconnectedToken = tokens[1];
    let channelsSubject: BehaviorSubject<Channel[]>;

    beforeEach(
        waitForAsync(() => {
            const tokenPollingMock = stub<TokenPollingService>();
            // @ts-ignore
            tokenPollingMock.tokens$ = of(tokens);
            tokenPollingMock.refresh = () => {};

            const channelPollingMock = stub<ChannelPollingService>();
            channelsSubject = new BehaviorSubject(
                createTestChannels(1, tokens[0])
            );
            // @ts-ignore
            channelPollingMock.channels$ = channelsSubject.asObservable();
            channelPollingMock.refresh = () => {};

            TestBed.configureTestingModule({
                declarations: [
                    TokenComponent,
                    DecimalPipe,
                    DisplayDecimalsPipe,
                    BalanceWithSymbolComponent,
                    TokenNetworkSelectorComponent,
                ],
                providers: [
                    RaidenService,
                    TestProviders.MockRaidenConfigProvider(),
                    PendingTransferPollingService,
                    TestProviders.MockMatDialog(),
                    TestProviders.AddressBookStubProvider(),
                    {
                        provide: ChannelPollingService,
                        useValue: channelPollingMock,
                    },
                    {
                        provide: TokenPollingService,
                        useValue: tokenPollingMock,
                    },
                    SelectedTokenService,
                    TestProviders.MockRaidenConfigProvider(),
                ],
                imports: [
                    RaidenIconsModule,
                    MaterialComponentsModule,
                    HttpClientTestingModule,
                    NoopAnimationsModule,
                    ClipboardModule,
                ],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TokenComponent);
        component = fixture.componentInstance;

        dialog = (<unknown>TestBed.inject(MatDialog)) as MockMatDialog;
        raidenService = TestBed.inject(RaidenService);
        fixture.detectChanges();
    });

    describe('as all networks view', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
            fixture.destroy();
        });

        it('should be able to select a token', () => {
            const selectedTokenService = TestBed.inject(SelectedTokenService);
            const setTokenSpy = spyOn(
                selectedTokenService,
                'setToken'
            ).and.callThrough();

            mockOpenMatSelect(fixture.debugElement);
            fixture.detectChanges();

            mockMatSelectByIndex(fixture.debugElement, 2);
            fixture.detectChanges();

            expect(setTokenSpy).toHaveBeenCalledTimes(1);
            expect(setTokenSpy).toHaveBeenCalledWith(tokens[0]);
        });

        it('should open payment dialog with no token network selected', () => {
            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            const dialogResult: PaymentDialogPayload = {
                tokenAddress: connectedToken.address,
                targetAddress: createAddress(),
                amount: new BigNumber(10),
                paymentIdentifier: undefined,
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
                amount: undefined,
            };
            expect(dialogSpy).toHaveBeenCalledTimes(1);
            expect(dialogSpy).toHaveBeenCalledWith(PaymentDialogComponent, {
                data: payload,
                width: '360px',
            });
            expect(initiatePaymentSpy).toHaveBeenCalledTimes(1);
            expect(initiatePaymentSpy).toHaveBeenCalledWith(
                dialogResult.tokenAddress,
                dialogResult.targetAddress,
                dialogResult.amount,
                dialogResult.paymentIdentifier
            );
        });

        it('should not have an options menu', () => {
            const button = fixture.debugElement.query(By.css('#options'));
            expect(button).toBeFalsy();
        });

        it('should open quick connect dialog with token undefined when no channels are open', () => {
            channelsSubject.next([]);
            fixture.detectChanges();

            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            const dialogResult: ConnectionManagerDialogPayload = {
                token: unconnectedToken,
                funds: new BigNumber(10),
            };
            spyOn(dialog, 'returns').and.returnValues(true, dialogResult);
            spyOn(raidenService, 'connectTokenNetwork').and.returnValue(
                of(null)
            );

            clickElement(fixture.debugElement, '#transfer');
            fixture.detectChanges();

            const confirmationPayload: ConfirmationDialogPayload = {
                title: 'No open  channels',
                message:
                    'Do you want to use quick connect to automatically open  channels?',
            };
            const connectionManagerPayload: ConnectionManagerDialogPayload = {
                token: undefined,
                funds: undefined,
            };
            expect(dialogSpy).toHaveBeenCalledTimes(2);
            expect(dialogSpy.calls.first().args).toEqual([
                ConfirmationDialogComponent,
                {
                    data: confirmationPayload,
                    width: '360px',
                },
            ]);
            expect(dialogSpy.calls.mostRecent().args).toEqual([
                ConnectionManagerDialogComponent,
                {
                    data: connectionManagerPayload,
                    width: '360px',
                },
            ]);
        });
    });

    describe('as token view', () => {
        let selectedTokenService: SelectedTokenService;

        beforeEach(() => {
            selectedTokenService = TestBed.inject(SelectedTokenService);

            mockOpenMatSelect(fixture.debugElement);
            fixture.detectChanges();

            mockMatSelectByIndex(fixture.debugElement, 2);
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
            fixture.destroy();
        });

        it('should be able to select the all networks view', () => {
            const setTokenSpy = spyOn(
                selectedTokenService,
                'setToken'
            ).and.callThrough();

            mockOpenMatSelect(fixture.debugElement);
            fixture.detectChanges();

            mockMatSelectByIndex(fixture.debugElement, 1);
            fixture.detectChanges();

            expect(setTokenSpy).toHaveBeenCalledTimes(1);
            expect(setTokenSpy).toHaveBeenCalledWith(undefined);
        });

        it('should open payment dialog with token network selected', () => {
            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            const dialogResult: PaymentDialogPayload = {
                tokenAddress: connectedToken.address,
                targetAddress: createAddress(),
                amount: new BigNumber(10),
                paymentIdentifier: undefined,
            };
            dialog.returns = () => dialogResult;
            const initiatePaymentSpy = spyOn(
                raidenService,
                'initiatePayment'
            ).and.returnValue(of(null));
            clickElement(fixture.debugElement, '#transfer');

            const payload: PaymentDialogPayload = {
                tokenAddress: connectedToken.address,
                targetAddress: '',
                amount: undefined,
            };
            expect(dialogSpy).toHaveBeenCalledTimes(1);
            expect(dialogSpy).toHaveBeenCalledWith(PaymentDialogComponent, {
                data: payload,
                width: '360px',
            });
            expect(initiatePaymentSpy).toHaveBeenCalledTimes(1);
            expect(initiatePaymentSpy).toHaveBeenCalledWith(
                dialogResult.tokenAddress,
                dialogResult.targetAddress,
                dialogResult.amount,
                dialogResult.paymentIdentifier
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

        it('should open quick connect dialog when no channels are open', () => {
            selectedTokenService.setToken(unconnectedToken);
            fixture.detectChanges();

            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            const dialogResult: ConnectionManagerDialogPayload = {
                token: unconnectedToken,
                funds: new BigNumber(10),
            };
            spyOn(dialog, 'returns').and.returnValues(true, dialogResult);
            const connectSpy = spyOn(
                raidenService,
                'connectTokenNetwork'
            ).and.returnValue(of(null));

            clickElement(fixture.debugElement, '#transfer');
            fixture.detectChanges();

            const confirmationPayload: ConfirmationDialogPayload = {
                title: `No open ${unconnectedToken.symbol} channels`,
                message: `Do you want to use quick connect to automatically open ${unconnectedToken.symbol} channels?`,
            };
            const connectionManagerPayload: ConnectionManagerDialogPayload = {
                token: unconnectedToken,
                funds: undefined,
            };
            expect(dialogSpy).toHaveBeenCalledTimes(2);
            expect(dialogSpy.calls.first().args).toEqual([
                ConfirmationDialogComponent,
                {
                    data: confirmationPayload,
                    width: '360px',
                },
            ]);
            expect(dialogSpy.calls.mostRecent().args).toEqual([
                ConnectionManagerDialogComponent,
                {
                    data: connectionManagerPayload,
                    width: '360px',
                },
            ]);
            expect(connectSpy).toHaveBeenCalledTimes(1);
            expect(connectSpy).toHaveBeenCalledWith(
                dialogResult.funds,
                dialogResult.token.address
            );
        });

        it('should not open quick connect dialog when user cancels confirmation', () => {
            selectedTokenService.setToken(unconnectedToken);
            fixture.detectChanges();

            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            dialog.cancelled = true;

            clickElement(fixture.debugElement, '#transfer');
            fixture.detectChanges();

            expect(dialogSpy).toHaveBeenCalledTimes(1);
        });

        it('should not call the raiden service if quick connect is cancelled', () => {
            selectedTokenService.setToken(unconnectedToken);
            fixture.detectChanges();

            const dialogSpy = spyOn(dialog, 'open').and.callThrough();
            spyOn(dialog, 'returns').and.returnValues(true, null);
            const connectSpy = spyOn(
                raidenService,
                'connectTokenNetwork'
            ).and.returnValue(of(null));

            clickElement(fixture.debugElement, '#transfer');
            fixture.detectChanges();

            expect(dialogSpy).toHaveBeenCalledTimes(2);
            expect(connectSpy).toHaveBeenCalledTimes(0);
        });

        it('should mint 0.5 tokens when token has 18 decimals', () => {
            clickElement(fixture.debugElement, '#options');
            fixture.detectChanges();

            const mintSpy = spyOn(raidenService, 'mintToken').and.returnValue(
                of(null)
            );
            clickElement(fixture.debugElement, '#mint');
            expect(mintSpy).toHaveBeenCalledTimes(1);
            expect(mintSpy).toHaveBeenCalledWith(
                connectedToken,
                raidenService.raidenAddress,
                new BigNumber(500000000000000000)
            );
        });

        it('should mint 5000 tokens when token has no decimals', () => {
            const noDecimalsToken = createToken({ decimals: 0 });
            selectedTokenService.setToken(noDecimalsToken);
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
                message: `Are you sure you want to close and settle all ${connectedToken.symbol} channels in ${connectedToken.name} network?`,
            };
            expect(dialogSpy).toHaveBeenCalledTimes(1);
            expect(dialogSpy).toHaveBeenCalledWith(
                ConfirmationDialogComponent,
                {
                    data: payload,
                    width: '360px',
                }
            );
            expect(leaveSpy).toHaveBeenCalledTimes(1);
            expect(leaveSpy).toHaveBeenCalledWith(connectedToken);
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
