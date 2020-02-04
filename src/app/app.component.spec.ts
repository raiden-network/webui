import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
    async
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { MockConfig } from '../testing/mock-config';
import { MaterialComponentsModule } from './modules/material-components/material-components.module';
import { ChannelPollingService } from './services/channel-polling.service';
import { RaidenConfig } from './services/raiden.config';
import { RaidenService } from './services/raiden.service';
import {
    ErrorComponent,
    ErrorPayload
} from './components/error/error.component';
import { BehaviorSubject, of, NEVER } from 'rxjs';
import { TestProviders } from '../testing/test-providers';
import { Network } from './utils/network-info';
import { NotificationService } from './services/notification.service';
import { NotificationPanelComponent } from './components/notification/notification-panel/notification-panel.component';
import { NotificationItemComponent } from './components/notification/notification-item/notification-item.component';
import { HttpErrorResponse } from '@angular/common/http';
import { RaidenIconsModule } from './modules/raiden-icons/raiden-icons.module';
import { stub } from '../testing/stub';
import { createNetworkMock } from '../testing/test-data';
import { PendingTransferPollingService } from './services/pending-transfer-polling.service';
import { PaymentHistoryPollingService } from './services/payment-history-polling.service';
import { UtilityService } from './services/utility.service';
import { ConnectionErrorType } from './models/connection-errors';
import { MockMatDialog } from '../testing/mock-mat-dialog';
import { MatDialog } from '@angular/material/dialog';

describe('AppComponent', () => {
    let fixture: ComponentFixture<AppComponent>;
    let app: AppComponent;

    let networkSubject: BehaviorSubject<Network>;
    let notificationService: NotificationService;
    let dialog: MockMatDialog;

    beforeEach(async(() => {
        const raidenServiceMock = stub<RaidenService>();
        networkSubject = new BehaviorSubject(createNetworkMock());
        // @ts-ignore
        raidenServiceMock.network$ = networkSubject.asObservable();
        // @ts-ignore
        raidenServiceMock.paymentInitiated$ = NEVER;

        const pendingTransferPollingMock = stub<
            PendingTransferPollingService
        >();
        // @ts-ignore
        pendingTransferPollingMock.pendingTransfers$ = of([]);

        const paymentHistoryPollingMock = stub<PaymentHistoryPollingService>();
        // @ts-ignore
        paymentHistoryPollingMock.paymentHistory$ = of([]);

        TestBed.configureTestingModule({
            declarations: [
                AppComponent,
                NotificationPanelComponent,
                NotificationItemComponent
            ],
            providers: [
                {
                    provide: RaidenConfig,
                    useClass: MockConfig
                },
                {
                    provide: RaidenService,
                    useValue: raidenServiceMock
                },
                {
                    provide: PendingTransferPollingService,
                    useValue: pendingTransferPollingMock
                },
                {
                    provide: PaymentHistoryPollingService,
                    useValue: paymentHistoryPollingMock
                },
                NotificationService,
                ChannelPollingService,
                TestProviders.HammerJSProvider(),
                TestProviders.MockMatDialog(),
                UtilityService
            ],
            imports: [
                MaterialComponentsModule,
                RouterTestingModule,
                HttpClientTestingModule,
                NoopAnimationsModule,
                RaidenIconsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AppComponent);
        app = fixture.componentInstance;

        notificationService = TestBed.get(NotificationService);
        dialog = TestBed.get(MatDialog);
        const channelPollingService = TestBed.get(ChannelPollingService);
        spyOn(channelPollingService, 'channels').and.returnValue(of([]));
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

    it('should show the API error screen', () => {
        const dialogSpy = spyOn(dialog, 'open');
        const error = new HttpErrorResponse({});
        // @ts-ignore
        error.message = 'API error occurred.';
        notificationService.apiError = error;
        fixture.detectChanges();

        const payload: ErrorPayload = {
            type: ConnectionErrorType.ApiError,
            errorContent: error.message
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(ErrorComponent, {
            data: payload,
            width: '500px',
            disableClose: true,
            panelClass: 'grey-dialog'
        });
    });

    it('should show the RPC error screen', () => {
        const dialogSpy = spyOn(dialog, 'open');
        const error = new Error('RPC error occurred.');
        notificationService.rpcError = error;
        fixture.detectChanges();

        const payload: ErrorPayload = {
            type: ConnectionErrorType.RpcError,
            errorContent: error.stack
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(ErrorComponent, {
            data: payload,
            width: '500px',
            disableClose: true,
            panelClass: 'grey-dialog'
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

    it('should show the API error screen when there is an API and a RPC error', function() {
        notificationService.rpcError = new Error('RPC error occurred.');
        fixture.detectChanges();

        const error = new HttpErrorResponse({});
        // @ts-ignore
        error.message = 'API error occurred.';
        notificationService.apiError = error;
        fixture.detectChanges();

        const payload: ErrorPayload = {
            type: ConnectionErrorType.ApiError,
            errorContent: error.message
        };
        // @ts-ignore
        expect(app.errorDialog.componentInstance.data).toEqual(payload);
    });
});
