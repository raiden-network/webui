import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {
    HttpClientTestingModule,
    HttpTestingController,
} from '@angular/common/http/testing';
import {
    ComponentFixture,
    fakeAsync,
    TestBed,
    tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LosslessJsonInterceptor } from 'app/interceptors/lossless-json.interceptor';
import { Channel } from 'app/models/channel';
import { SuggestedConnection } from 'app/models/connection';
import { Settings } from 'app/models/settings';
import { MaterialComponentsModule } from 'app/modules/material-components/material-components.module';
import { RaidenIconsModule } from 'app/modules/raiden-icons/raiden-icons.module';
import { DecimalPipe } from 'app/pipes/decimal.pipe';
import { DisplayDecimalsPipe } from 'app/pipes/display-decimals.pipe';
import { ChannelPollingService } from 'app/services/channel-polling.service';
import { RaidenService } from 'app/services/raiden.service';
import { TokenPollingService } from 'app/services/token-polling.service';
import { amountFromDecimal } from 'app/utils/amount.converter';
import { losslessStringify } from 'app/utils/lossless-json.converter';
import BigNumber from 'bignumber.js';
import { ClipboardModule } from 'ngx-clipboard';
import { BehaviorSubject, of } from 'rxjs';
import {
    clickElement,
    mockInput,
    mockMatSelectFirst,
    mockOpenMatSelect,
} from 'testing/interaction-helper';
import { stub } from 'testing/stub';
import {
    createAddress,
    createChannel,
    createSettings,
    createSuggestedConnections,
    createToken,
} from 'testing/test-data';
import { TestProviders } from 'testing/test-providers';
import { BalanceWithSymbolComponent } from '../balance-with-symbol/balance-with-symbol.component';
import { RaidenDialogComponent } from '../raiden-dialog/raiden-dialog.component';
import { TokenInputComponent } from '../token-input/token-input.component';
import { TokenNetworkSelectorComponent } from '../token-network-selector/token-network-selector.component';
import { ConnectionSelectorComponent } from './connection-selector/connection-selector.component';
import {
    QuickConnectDialogComponent,
    QuickConnectDialogPayload,
} from './quick-connect-dialog.component';

describe('QuickConnectDialogComponent', () => {
    let component: QuickConnectDialogComponent;
    let fixture: ComponentFixture<QuickConnectDialogComponent>;

    const suggestions = createSuggestedConnections();
    const token = createToken({
        decimals: 0,
        balance: new BigNumber(1000),
        connected: {
            channels: 5,
            sum_deposits: new BigNumber(50),
        },
    });
    const tokenNetworkAddress = createAddress();
    const settings = createSettings();
    const totalAmountInput = '70';
    const totalAmountValue = amountFromDecimal(
        new BigNumber(totalAmountInput),
        token.decimals
    );
    let channelsSubject: BehaviorSubject<Channel[]>;
    let settingsSubject: BehaviorSubject<Settings>;
    let mockHttp: HttpTestingController;

    function initServices() {
        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'getTokenNetworkAddress').and.returnValue(
            of(tokenNetworkAddress)
        );
        settingsSubject = new BehaviorSubject(settings);
        spyOn(raidenService, 'getSettings').and.returnValue(
            settingsSubject.asObservable()
        );
        mockHttp = TestBed.inject(HttpTestingController);
    }

    beforeEach(async () => {
        const payload: QuickConnectDialogPayload = {
            token: token,
        };

        const tokenPollingMock = stub<TokenPollingService>();
        // @ts-ignore
        tokenPollingMock.tokens$ = of([token]);
        tokenPollingMock.getTokenUpdates = (tokenAddress) =>
            of(tokenAddress ? token : undefined);

        const channelPollingMock = stub<ChannelPollingService>();
        channelsSubject = new BehaviorSubject([]);
        // @ts-ignore
        channelPollingMock.channels$ = channelsSubject.asObservable();

        await TestBed.configureTestingModule({
            declarations: [
                QuickConnectDialogComponent,
                TokenInputComponent,
                RaidenDialogComponent,
                DecimalPipe,
                DisplayDecimalsPipe,
                TokenNetworkSelectorComponent,
                BalanceWithSymbolComponent,
                ConnectionSelectorComponent,
            ],
            providers: [
                TestProviders.MockMatDialogData(payload),
                TestProviders.MockMatDialogRef({ close: () => {} }),
                TestProviders.MockRaidenConfigProvider(),
                {
                    provide: TokenPollingService,
                    useValue: tokenPollingMock,
                },
                TestProviders.AddressBookStubProvider(),
                {
                    provide: ChannelPollingService,
                    useValue: channelPollingMock,
                },
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: LosslessJsonInterceptor,
                    multi: true,
                },
            ],
            imports: [
                MaterialComponentsModule,
                ReactiveFormsModule,
                NoopAnimationsModule,
                RaidenIconsModule,
                HttpClientTestingModule,
                ClipboardModule,
            ],
        }).compileComponents();
    });

    describe('with token payload', () => {
        function initComponentForFakeAsync(
            suggestionsResponse: SuggestedConnection[] | Error = suggestions
        ) {
            fixture.detectChanges();
            tick();

            const request = mockHttp.expectOne({
                url: `${settings.pathfinding_service_address}/api/v1/${tokenNetworkAddress}/suggest_partner`,
                method: 'GET',
            });
            request.flush(losslessStringify(suggestionsResponse), {
                status: suggestionsResponse instanceof Error ? 400 : 200,
                statusText: '',
            });

            tick(300);
            fixture.detectChanges();
            tick();
        }

        beforeEach(() => {
            initServices();
            fixture = TestBed.createComponent(QuickConnectDialogComponent);
            component = fixture.componentInstance;
        });

        it('should be created', () => {
            fixture.detectChanges();
            expect(component).toBeTruthy();
        });

        it('should close the dialog with the result when accept button is clicked', fakeAsync(() => {
            initComponentForFakeAsync();

            mockInput(
                fixture.debugElement.query(
                    By.css('app-token-input[formControlName="totalAmount"')
                ),
                'input',
                totalAmountInput
            );
            fixture.detectChanges();

            // @ts-ignore
            const closeSpy = spyOn(component.dialogRef, 'close');
            clickElement(fixture.debugElement, '#accept');
            tick(300);
            fixture.detectChanges();

            expect(closeSpy).toHaveBeenCalledTimes(1);
            expect(closeSpy).toHaveBeenCalledWith({
                token: token,
                connectionChoices: [
                    {
                        partnerAddress: suggestions[0].address,
                        deposit: totalAmountValue,
                    },
                ],
            });
        }));

        it('should close the dialog with no result when cancel button is clicked', fakeAsync(() => {
            initComponentForFakeAsync();

            mockInput(
                fixture.debugElement.query(
                    By.css('app-token-input[formControlName="totalAmount"')
                ),
                'input',
                totalAmountInput
            );
            fixture.detectChanges();

            // @ts-ignore
            const closeSpy = spyOn(component.dialogRef, 'close');
            clickElement(fixture.debugElement, '#cancel');
            tick(300);
            fixture.detectChanges();

            expect(closeSpy).toHaveBeenCalledTimes(1);
            expect(closeSpy).toHaveBeenCalledWith();
        }));

        it('should set the maximum token amount to the balance', fakeAsync(() => {
            initComponentForFakeAsync();

            const tokenInputComponent: TokenInputComponent = fixture.debugElement.query(
                By.css('app-token-input[formControlName="totalAmount"')
            ).componentInstance;
            expect(tokenInputComponent.maxAmount.isEqualTo(token.balance)).toBe(
                true
            );
        }));

        it('should filter the suggestions by existing channels', fakeAsync(() => {
            channelsSubject.next([
                createChannel({
                    userToken: token,
                    partner_address: suggestions[0].address,
                }),
            ]);
            initComponentForFakeAsync();

            expect(component.suggestions.length).toEqual(
                suggestions.length - 1
            );
            expect(component.suggestions).toEqual(suggestions.slice(1));
        }));

        it('should show an error if there are no suggestions', fakeAsync(() => {
            initComponentForFakeAsync([]);

            expect(component.suggestions.length).toEqual(0);
            expect(component.pfsError).toBe(true);
            expect(component.noPfs).toBe(false);
            expect(component.form.controls.totalAmount.disabled).toBe(true);
        }));

        it('should show an error if it fails to request the suggestions', fakeAsync(() => {
            initComponentForFakeAsync(new Error('API not supported'));

            expect(component.suggestions.length).toEqual(0);
            expect(component.pfsError).toBe(true);
            expect(component.noPfs).toBe(false);
            expect(component.form.controls.totalAmount.disabled).toBe(true);
        }));

        it('should show an error if it there is no PFS configured', fakeAsync(() => {
            settingsSubject.next(
                createSettings({ pathfinding_service_address: null })
            );

            fixture.detectChanges();
            tick();

            fixture.detectChanges();
            tick();

            expect(component.suggestions.length).toEqual(0);
            expect(component.pfsError).toBe(true);
            expect(component.noPfs).toBe(true);
            expect(component.form.controls.totalAmount.disabled).toBe(true);
        }));
    });

    describe('without token payload', () => {
        beforeEach(() => {
            const payload: QuickConnectDialogPayload = {
                token: undefined,
            };
            TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: payload });
            initServices();
            fixture = TestBed.createComponent(QuickConnectDialogComponent);
            component = fixture.componentInstance;
        });

        it('should show a token network selector', () => {
            fixture.detectChanges();
            const selector = fixture.debugElement.query(
                By.directive(MatSelect)
            );
            expect(selector).toBeTruthy();
            expect(component.form.value.token).toBeFalsy();
        });

        it('should not set the maximum token amount by default', () => {
            fixture.detectChanges();

            const tokenInputComponent: TokenInputComponent = fixture.debugElement.query(
                By.css('app-token-input[formControlName="totalAmount"')
            ).componentInstance;
            expect(tokenInputComponent.maxAmount).toBeUndefined();
        });

        it('should set the maximum token amount after token selection', () => {
            fixture.detectChanges();

            const networkSelectorElement = fixture.debugElement.query(
                By.directive(TokenNetworkSelectorComponent)
            );
            mockOpenMatSelect(networkSelectorElement);
            fixture.detectChanges();
            mockMatSelectFirst(fixture.debugElement);
            fixture.detectChanges();

            const tokenInputComponent: TokenInputComponent = fixture.debugElement.query(
                By.css('app-token-input[formControlName="totalAmount"')
            ).componentInstance;
            expect(tokenInputComponent.maxAmount.isEqualTo(token.balance)).toBe(
                true
            );
        });
    });
});
