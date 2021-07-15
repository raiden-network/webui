import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
    waitForAsync,
    flush,
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { MaterialComponentsModule } from './modules/material-components/material-components.module';
import { ChannelPollingService } from './services/channel-polling.service';
import { RaidenService } from './services/raiden.service';
import {
    ErrorComponent,
    ErrorPayload,
} from './components/error/error.component';
import { BehaviorSubject, of, NEVER, throwError, Subject } from 'rxjs';
import { TestProviders } from '../testing/test-providers';
import { Network } from './utils/network-info';
import { NotificationService } from './services/notification.service';
import { NotificationPanelComponent } from './components/notification/notification-panel/notification-panel.component';
import { NotificationItemComponent } from './components/notification/notification-item/notification-item.component';
import { HttpErrorResponse } from '@angular/common/http';
import { RaidenIconsModule } from './modules/raiden-icons/raiden-icons.module';
import { stub } from '../testing/stub';
import { createNetworkMock, createAddress } from '../testing/test-data';
import { PendingTransferPollingService } from './services/pending-transfer-polling.service';
import { PaymentHistoryPollingService } from './services/payment-history-polling.service';
import { SharedService } from './services/shared.service';
import { ConnectionErrorType } from './models/connection-errors';
import { MockMatDialog } from '../testing/mock-mat-dialog';
import { MatDialog } from '@angular/material/dialog';
import { ClipboardModule } from 'ngx-clipboard';
import { NavigationEntryComponent } from './components/navigation-entry/navigation-entry.component';
import { HeaderComponent } from './components/header/header.component';
import { SearchFieldComponent } from './components/search-field/search-field.component';
import { DisplayDecimalsPipe } from './pipes/display-decimals.pipe';
import { TokenPollingService } from './services/token-polling.service';
import { clickElement } from '../testing/interaction-helper';
import {
    ConfirmationDialogPayload,
    ConfirmationDialogComponent,
} from './components/confirmation-dialog/confirmation-dialog.component';
import { By } from '@angular/platform-browser';
import { ToastrModule } from 'ngx-toastr';
import { MatSidenav } from '@angular/material/sidenav';
import { DecimalPipe } from './pipes/decimal.pipe';
import { BalanceWithSymbolComponent } from './components/balance-with-symbol/balance-with-symbol.component';
import { TokenNetworkSelectorComponent } from './components/token-network-selector/token-network-selector.component';
import { ShortenAddressPipe } from './pipes/shorten-address.pipe';

describe('AppComponent', () => {
    let fixture: ComponentFixture<AppComponent>;
    let app: AppComponent;

    let networkSubject: BehaviorSubject<Network>;
    let notificationService: NotificationService;
    let dialog: MockMatDialog;
    const channelsSubject = new BehaviorSubject([]);
    const paymentHistorySubject = new BehaviorSubject([]);
    const pendingTransfersSubject = new BehaviorSubject([]);
    const globalRetrySubject = new Subject();

    beforeEach(
        waitForAsync(() => {
            const raidenServiceMock = stub<RaidenService>();
            networkSubject = new BehaviorSubject(createNetworkMock());
            // @ts-ignore
            raidenServiceMock.network$ = networkSubject.asObservable();
            // @ts-ignore
            raidenServiceMock.paymentInitiated$ = NEVER;
            // @ts-ignore
            raidenServiceMock.balance$ = of('0');
            // @ts-ignore
            raidenServiceMock.raidenAddress$ = of(createAddress());
            // @ts-ignore
            raidenServiceMock.reconnected$ = NEVER;
            raidenServiceMock.shutdownRaiden = () => of(null);
            raidenServiceMock.getStatus = () => of({ status: 'ready' });
            raidenServiceMock.getUserToken = () => undefined;
            raidenServiceMock.attemptRpcConnection = () => undefined;
            // @ts-ignore
            raidenServiceMock.globalRetry$ = globalRetrySubject.asObservable();

            const pendingTransferPollingMock =
                stub<PendingTransferPollingService>();
            // @ts-ignore
            pendingTransferPollingMock.pendingTransfers$ =
                pendingTransfersSubject.asObservable();

            const paymentHistoryPollingMock =
                stub<PaymentHistoryPollingService>();
            // @ts-ignore
            paymentHistoryPollingMock.newPaymentEvents$ =
                paymentHistorySubject.asObservable();

            const channelPollingMock = stub<ChannelPollingService>();
            // @ts-ignore
            channelPollingMock.channels$ = channelsSubject.asObservable();

            const tokenPollingMock = stub<TokenPollingService>();
            // @ts-ignore
            tokenPollingMock.tokens$ = of([]);

            TestBed.configureTestingModule({
                declarations: [
                    AppComponent,
                    NotificationPanelComponent,
                    NotificationItemComponent,
                    NavigationEntryComponent,
                    HeaderComponent,
                    SearchFieldComponent,
                    DisplayDecimalsPipe,
                    DecimalPipe,
                    BalanceWithSymbolComponent,
                    TokenNetworkSelectorComponent,
                    ShortenAddressPipe,
                ],
                providers: [
                    TestProviders.MockRaidenConfigProvider(),
                    {
                        provide: RaidenService,
                        useValue: raidenServiceMock,
                    },
                    {
                        provide: PendingTransferPollingService,
                        useValue: pendingTransferPollingMock,
                    },
                    {
                        provide: PaymentHistoryPollingService,
                        useValue: paymentHistoryPollingMock,
                    },
                    NotificationService,
                    ChannelPollingService,
                    {
                        provide: ChannelPollingService,
                        useValue: channelPollingMock,
                    },
                    TestProviders.MockMatDialog(),
                    SharedService,
                    TestProviders.AddressBookStubProvider(),
                    {
                        provide: TokenPollingService,
                        useValue: tokenPollingMock,
                    },
                    TestProviders.MockUserDepositService(),
                ],
                imports: [
                    MaterialComponentsModule,
                    RouterTestingModule,
                    HttpClientTestingModule,
                    NoopAnimationsModule,
                    RaidenIconsModule,
                    ClipboardModule,
                    ToastrModule.forRoot({ timeOut: 50, easeTime: 0 }),
                ],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(AppComponent);
        app = fixture.componentInstance;

        notificationService = TestBed.inject(NotificationService);
        dialog = TestBed.inject(MatDialog) as unknown as MockMatDialog;
    });

    it('should create the app', () => {
        fixture.detectChanges();
        expect(app).toBeTruthy();
        fixture.destroy();
    });

    it('should hide the network info after 5 seconds', fakeAsync(() => {
        fixture.detectChanges();
        expect(app.showNetworkInfo).toBe(true);
        tick(5000);
        expect(app.showNetworkInfo).toBe(false);
    }));

    it('should not show the network info on mainnet', () => {
        networkSubject.next(createNetworkMock({ chainId: 1 }));
        fixture.detectChanges();
        expect(app.showNetworkInfo).toBe(false);
    });

    it('should toggle the notification panel', () => {
        fixture.detectChanges();
        const notificationSidenav = fixture.debugElement.query(
            By.css('.notification-sidenav')
        ).componentInstance as MatSidenav;
        const toggleSpy = spyOn(
            notificationSidenav,
            'toggle'
        ).and.callThrough();
        clickElement(fixture.debugElement, '.notification-panel-button');
        expect(toggleSpy).toHaveBeenCalledTimes(1);
    });

    it('should show the API error screen', () => {
        const dialogSpy = spyOn(dialog, 'open');
        const error = new HttpErrorResponse({});
        // @ts-ignore
        error.message = 'API error occurred.';
        notificationService.apiError = error;
        fixture.detectChanges();

        const payload: ErrorPayload = {
            type: ConnectionErrorType.ApiError,
            errorContent: error.message,
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(ErrorComponent, {
            data: payload,
            disableClose: true,
            panelClass: 'grey-dialog',
        });
    });

    it('should show the RPC error screen', () => {
        const dialogSpy = spyOn(dialog, 'open');
        const error = new Error('RPC error occurred.');
        notificationService.rpcError = error;
        fixture.detectChanges();

        const payload: ErrorPayload = {
            type: ConnectionErrorType.RpcError,
            errorContent: error.stack,
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(ErrorComponent, {
            data: payload,
            disableClose: true,
            panelClass: 'grey-dialog',
        });
    });

    it('should close the error dialog when there is no error anymore', () => {
        const error = new HttpErrorResponse({});
        // @ts-ignore
        error.message = 'API error occurred.';
        notificationService.apiError = error;
        fixture.detectChanges();

        // @ts-ignore
        const closeSpy = spyOn(app.errorDialog, 'close');
        notificationService.apiError = undefined;
        fixture.detectChanges();

        expect(closeSpy).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(app.errorDialog).toBe(undefined);
    });

    it('should show the API error screen when there is an API and a RPC error', function () {
        notificationService.rpcError = new Error('RPC error occurred.');
        fixture.detectChanges();

        const error = new HttpErrorResponse({});
        // @ts-ignore
        error.message = 'API error occurred.';
        notificationService.apiError = error;
        fixture.detectChanges();

        const payload: ErrorPayload = {
            type: ConnectionErrorType.ApiError,
            errorContent: error.message,
        };
        // @ts-ignore
        expect(app.errorDialog.componentInstance.data).toEqual(payload);
    });

    it('should shutdown Raiden', () => {
        fixture.detectChanges();
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const raidenService = TestBed.inject(RaidenService);
        const shutdownSpy = spyOn(
            raidenService,
            'shutdownRaiden'
        ).and.returnValue(of(null));
        clickElement(fixture.debugElement, '.shutdown');

        const payload: ConfirmationDialogPayload = {
            title: 'Shutdown',
            message: 'Are you sure you want to shut down your Raiden Node?',
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(ConfirmationDialogComponent, {
            data: payload,
        });
        expect(shutdownSpy).toHaveBeenCalledTimes(1);
    });

    it('should not shutdown Raiden if dialog is cancelled', () => {
        fixture.detectChanges();
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        dialog.returns = () => null;
        const raidenService = TestBed.inject(RaidenService);
        const shutdownSpy = spyOn(
            raidenService,
            'shutdownRaiden'
        ).and.returnValue(of(null));
        clickElement(fixture.debugElement, '.shutdown');

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(shutdownSpy).toHaveBeenCalledTimes(0);
    });

    it('should poll the status until the API is available', fakeAsync(() => {
        const raidenService = TestBed.inject(RaidenService);
        const statusSpy = spyOn(raidenService, 'getStatus').and.returnValues(
            of({ status: 'unavailable' }),
            of({ status: 'unavailable' }),
            of({ status: 'ready' })
        );
        fixture.detectChanges();

        expect(app.apiStatus).toEqual({ status: 'unavailable' });
        tick(500);
        expect(app.apiStatus).toEqual({ status: 'unavailable' });
        tick(500);
        expect(app.apiStatus).toEqual({ status: 'ready' });
        tick(5000);
        expect(statusSpy).toHaveBeenCalledTimes(3);
        flush();
    }));

    it('should not poll anything else than the status until the status is ready', fakeAsync(() => {
        const raidenService = TestBed.inject(RaidenService);
        const statusSpy = spyOn(raidenService, 'getStatus').and.returnValues(
            of({ status: 'unavailable' }),
            of({ status: 'ready' })
        );
        fixture.detectChanges();

        expect(app.apiStatus).toEqual({ status: 'unavailable' });
        expect(channelsSubject.observers.length).toBe(0);
        expect(pendingTransfersSubject.observers.length).toBe(0);
        expect(paymentHistorySubject.observers.length).toBe(0);
        tick(500);
        expect(app.apiStatus).toEqual({ status: 'ready' });
        expect(channelsSubject.observers.length).toBeGreaterThan(0);
        expect(pendingTransfersSubject.observers.length).toBeGreaterThan(0);
        expect(paymentHistorySubject.observers.length).toBeGreaterThan(0);
        tick(5000);
        expect(statusSpy).toHaveBeenCalledTimes(2);
        flush();
    }));

    it('should show a progress bar if blocks are being synced', fakeAsync(() => {
        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'getStatus').and.returnValues(
            of({ status: 'syncing', blocks_to_sync: 100 }),
            of({ status: 'syncing', blocks_to_sync: 30 }),
            of({ status: 'ready' })
        );
        fixture.detectChanges();

        expect(app.apiStatus).toEqual({
            status: 'syncing',
            blocks_to_sync: 100,
        });
        let progressBar = fixture.debugElement.query(By.css('.progress__bar'));
        expect(progressBar).toBeTruthy();
        expect(progressBar.nativeElement.value).toBe(0);
        tick(500);
        fixture.detectChanges();

        expect(app.apiStatus).toEqual({
            status: 'syncing',
            blocks_to_sync: 30,
        });
        progressBar = fixture.debugElement.query(By.css('.progress__bar'));
        expect(progressBar.nativeElement.value).toBe(70 / 100);
        tick(500);
        fixture.detectChanges();

        expect(app.apiStatus).toEqual({ status: 'ready' });
        progressBar = fixture.debugElement.query(By.css('.progress__bar'));
        expect(progressBar).toBeFalsy();

        tick(5000);
        flush();
    }));

    it('should retry RPC connection when status is ready', fakeAsync(() => {
        const error = new Error('RPC error occurred.');
        notificationService.rpcError = error;

        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'getStatus').and.returnValues(
            of({ status: 'unavailable' }),
            of({ status: 'ready' })
        );
        const attemptRpcSpy = spyOn(raidenService, 'attemptRpcConnection');
        fixture.detectChanges();

        expect(app.apiStatus).toEqual({ status: 'unavailable' });
        expect(attemptRpcSpy).toHaveBeenCalledTimes(0);
        tick(500);
        expect(app.apiStatus).toEqual({ status: 'ready' });
        expect(attemptRpcSpy).toHaveBeenCalledTimes(1);

        tick(5000);
        flush();
    }));

    it('should retry polling the status after an error', fakeAsync(() => {
        const raidenService = TestBed.inject(RaidenService);
        const statusSpy = spyOn(raidenService, 'getStatus').and.returnValues(
            throwError('API unavailable!'),
            of({ status: 'ready' })
        );
        fixture.detectChanges();

        expect(app.apiStatus).toBeFalsy();

        globalRetrySubject.next(null);
        tick();

        expect(app.apiStatus).toEqual({ status: 'ready' });
        tick(5000);
        expect(statusSpy).toHaveBeenCalledTimes(2);
        flush();
    }));
});
