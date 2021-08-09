import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
    ComponentFixture,
    fakeAsync,
    flush,
    TestBed,
    tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from 'app/modules/material-components/material-components.module';
import { RaidenIconsModule } from 'app/modules/raiden-icons/raiden-icons.module';
import { DecimalPipe } from 'app/pipes/decimal.pipe';
import { DisplayDecimalsPipe } from 'app/pipes/display-decimals.pipe';
import { RaidenConfig } from 'app/services/raiden.config';
import { ClipboardModule } from 'ngx-clipboard';
import { MockConfig } from 'testing/mock-config';
import { stub } from 'testing/stub';
import {
    createAddress,
    createNetworkMock,
    createToken,
} from 'testing/test-data';
import { TestProviders } from 'testing/test-providers';
import Web3 from 'web3';
import { BalanceWithSymbolComponent } from '../balance-with-symbol/balance-with-symbol.component';
import { RaidenDialogComponent } from '../raiden-dialog/raiden-dialog.component';
import { TokenInputComponent } from '../token-input/token-input.component';
import { TokenNetworkSelectorComponent } from '../token-network-selector/token-network-selector.component';
import {
    AccountDialogComponent,
    AccountDialogPayload,
} from './account-dialog.component';
import { Web3Factory } from 'app/services/web3-factory.service';
import { By } from '@angular/platform-browser';
import { RaidenService } from 'app/services/raiden.service';
import { of } from 'rxjs';
import {
    clickElement,
    mockInput,
    mockMatSelectByIndex,
    mockOpenMatSelect,
} from 'testing/interaction-helper';
import { TokenPollingService } from 'app/services/token-polling.service';
import { UserDepositService } from 'app/services/user-deposit.service';
import { NotificationService } from 'app/services/notification.service';

describe('AccountDialogComponent', () => {
    let component: AccountDialogComponent;
    let fixture: ComponentFixture<AccountDialogComponent>;

    const raidenAddress = createAddress();
    const account = createAddress();
    const chainId = 9100;
    const token = createToken();
    const servicesToken = createToken();

    let web3Mock: Web3;

    beforeEach(async () => {
        const payload: AccountDialogPayload = {
            asset: 'ETH',
        };

        web3Mock = stub<Web3>();
        web3Mock.eth = {
            getAccounts: () => Promise.resolve([]),
            requestAccounts: () => Promise.resolve([account]),
            getChainId: () => Promise.resolve(chainId),
            sendTransaction: () => Promise.resolve({}) as any,
            // @ts-ignore
            Contract: () => ({
                methods: {
                    transfer: () => ({
                        send: () => {},
                    }),
                },
            }),
        };

        const web3FactoryMock = stub<Web3Factory>();
        web3FactoryMock.create = () => web3Mock;
        web3FactoryMock.detectProvider = () =>
            Promise.resolve('http://localhost:8545');

        await TestBed.configureTestingModule({
            declarations: [
                AccountDialogComponent,
                TokenInputComponent,
                TokenNetworkSelectorComponent,
                RaidenDialogComponent,
                BalanceWithSymbolComponent,
                DisplayDecimalsPipe,
                DecimalPipe,
            ],
            providers: [
                TestProviders.MockMatDialogData(payload),
                TestProviders.MockMatDialogRef(),
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider(),
                {
                    provide: Web3Factory,
                    useValue: web3FactoryMock,
                },
                TokenPollingService,
                UserDepositService,
                TestProviders.SpyNotificationServiceProvider(),
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                ReactiveFormsModule,
                HttpClientTestingModule,
                RaidenIconsModule,
                ClipboardModule,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        const raidenConfig = TestBed.inject(RaidenConfig) as MockConfig;
        raidenConfig.updateNetwork(createNetworkMock({ chainId }));

        const raidenService = TestBed.inject(RaidenService);
        spyOnProperty(raidenService, 'raidenAddress', 'get').and.returnValue(
            raidenAddress
        );
        // @ts-ignore
        raidenService.raidenAddress$ = of(raidenAddress);

        const tokenPollingService = TestBed.inject(TokenPollingService);
        spyOn(tokenPollingService, 'getTokenUpdates').and.returnValue(
            of(token)
        );
        // @ts-ignore
        tokenPollingService.tokens$ = of([token]);

        const userDepositService = TestBed.inject(UserDepositService);
        // @ts-ignore
        userDepositService.servicesToken$ = of(servicesToken);

        fixture = TestBed.createComponent(AccountDialogComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should close the dialog with no result when close button is clicked', () => {
        // @ts-ignore
        const closeSpy = spyOn(component.dialogRef, 'close');
        clickElement(fixture.debugElement, '#close');
        fixture.detectChanges();

        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith();
    });

    it('should get the default account if already connected', fakeAsync(() => {
        spyOn(web3Mock.eth, 'getAccounts').and.resolveTo([account]);
        fixture.detectChanges();
        tick();
        expect(component.defaultAccount).toBe(account);
        fixture.destroy();
    }));

    it('should connect to a wallet', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();
        tick();
        expect(component.defaultAccount).toBe(account);
        fixture.destroy();
    }));

    it('should show an error when the web3 provider uses a different chain', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        spyOn(web3Mock.eth, 'getChainId').and.resolveTo(chainId + 1);
        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();
        tick();
        expect(component.defaultAccount).toBe(undefined);
        expect(component.wrongChainID).toBe(true);
        fixture.destroy();
    }));

    it('should show an error when the user rejects account access', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        spyOn(web3Mock.eth, 'requestAccounts').and.rejectWith(
            new Error('User rejected.')
        );
        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();
        tick();
        expect(component.defaultAccount).toBe(undefined);
        expect(component.accountRequestRejected).toBe(true);
        fixture.destroy();
    }));

    it('should send ETH to the Raiden account', fakeAsync(() => {
        const notificationService = TestBed.inject(NotificationService);
        const transactionSpy = spyOn(
            web3Mock.eth,
            'sendTransaction'
        ).and.callThrough();
        // @ts-ignore
        const closeSpy = spyOn(component.dialogRef, 'close');
        component.defaultAccount = account;
        fixture.detectChanges();

        mockInput(
            fixture.debugElement.query(By.directive(TokenInputComponent)),
            'input',
            '0.5'
        );
        tick();
        fixture.detectChanges();

        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();
        tick();

        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith();
        expect(transactionSpy).toHaveBeenCalledTimes(1);
        expect(transactionSpy).toHaveBeenCalledWith({
            from: account,
            to: raidenAddress,
            value: '500000000000000000',
        });
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);
        expect(notificationService.removePendingAction).toHaveBeenCalledTimes(
            1
        );
        expect(
            notificationService.addSuccessNotification
        ).toHaveBeenCalledTimes(1);
        fixture.destroy();
    }));

    it('should send tokens to the Raiden account', fakeAsync(() => {
        const notificationService = TestBed.inject(NotificationService);
        const sendSpy = jasmine.createSpy().and.resolveTo();
        const contract = {
            methods: {
                transfer: (to, value) => ({
                    send: sendSpy,
                }),
            },
        };
        const transferSpy = spyOn(
            contract.methods,
            'transfer'
        ).and.callThrough();
        // @ts-ignore
        spyOn(web3Mock.eth, 'Contract').and.returnValue(contract);
        // @ts-ignore
        const closeSpy = spyOn(component.dialogRef, 'close');
        component.defaultAccount = account;
        fixture.detectChanges();

        mockInput(
            fixture.debugElement.query(By.directive(TokenInputComponent)),
            'input',
            '0.5'
        );
        tick();
        fixture.detectChanges();

        mockOpenMatSelect(fixture.debugElement);
        fixture.detectChanges();
        mockMatSelectByIndex(fixture.debugElement, 1);
        fixture.detectChanges();

        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();
        tick();

        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith();
        expect(transferSpy).toHaveBeenCalledTimes(1);
        expect(transferSpy).toHaveBeenCalledWith(
            raidenAddress,
            '500000000000000000'
        );
        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledWith({ from: account });
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);
        expect(notificationService.removePendingAction).toHaveBeenCalledTimes(
            1
        );
        expect(
            notificationService.addSuccessNotification
        ).toHaveBeenCalledTimes(1);
        flush();
        fixture.destroy();
    }));

    it('should show an error if sending fails', fakeAsync(() => {
        const notificationService = TestBed.inject(NotificationService);
        spyOn(web3Mock.eth, 'sendTransaction').and.rejectWith(
            Error('Tx failed.')
        );
        component.defaultAccount = account;
        fixture.detectChanges();

        mockInput(
            fixture.debugElement.query(By.directive(TokenInputComponent)),
            'input',
            '0.5'
        );
        tick();
        fixture.detectChanges();

        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();
        tick();

        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);
        expect(notificationService.removePendingAction).toHaveBeenCalledTimes(
            1
        );
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
        fixture.destroy();
    }));

    it('should have a faucet button when network has a faucet', () => {
        fixture.detectChanges();
        expect(
            fixture.debugElement.query(By.css('#faucet-button'))
        ).toBeTruthy();
    });

    it('should not have a faucet button when network does not have a faucet', () => {
        const raidenConfig = TestBed.inject(RaidenConfig) as MockConfig;
        raidenConfig.updateNetwork(createNetworkMock({ faucet: null }));
        fixture.detectChanges();
        expect(
            fixture.debugElement.query(By.css('#faucet-button'))
        ).toBeFalsy();
    });

    it('should insert the address correctly into the href attribute of the faucet button', () => {
        fixture.detectChanges();
        const href = fixture.debugElement
            .query(By.css('#faucet-button'))
            .nativeElement.getAttribute('href');
        expect(href).toBe(`http://faucet.test/?${raidenAddress}`);
    });
});
