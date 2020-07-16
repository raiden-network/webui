import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { ChannelComponent } from './channel.component';
import { ClipboardModule } from 'ngx-clipboard';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { createChannel, createToken } from '../../../testing/test-data';
import BigNumber from 'bignumber.js';
import { TestProviders } from '../../../testing/test-providers';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import { RaidenService } from '../../services/raiden.service';
import { TokenPollingService } from '../../services/token-polling.service';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { IdenticonCacheService } from '../../services/identicon-cache.service';
import { Contacts } from '../../models/contact';
import { stub } from '../../../testing/stub';
import { AddressBookService } from '../../services/address-book.service';
import { clickElement } from '../../../testing/interaction-helper';
import { of } from 'rxjs';
import {
    DepositWithdrawDialogPayload,
    DepositWithdrawDialogComponent,
    DepositWithdrawDialogResult,
} from '../deposit-withdraw-dialog/deposit-withdraw-dialog.component';
import { DepositMode } from '../../models/deposit-mode.enum';
import { MatDialog } from '@angular/material/dialog';
import {
    ConfirmationDialogPayload,
    ConfirmationDialogComponent,
} from '../confirmation-dialog/confirmation-dialog.component';
import { BalanceWithSymbolComponent } from '../balance-with-symbol/balance-with-symbol.component';
import { AddressIdenticonComponent } from '../address-identicon/address-identicon.component';

describe('ChannelComponent', () => {
    let component: ChannelComponent;
    let fixture: ComponentFixture<ChannelComponent>;

    let dialog: MockMatDialog;
    let raidenService: RaidenService;
    const token = createToken();
    const channel = createChannel({ userToken: token });
    let contacts: Contacts;

    beforeEach(async(() => {
        const addressBookMock = stub<AddressBookService>();
        addressBookMock.get = () => contacts;

        TestBed.configureTestingModule({
            declarations: [
                ChannelComponent,
                DecimalPipe,
                DisplayDecimalsPipe,
                BalanceWithSymbolComponent,
                AddressIdenticonComponent,
            ],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                RaidenService,
                TokenPollingService,
                TestProviders.MockMatDialog(),
                ChannelPollingService,
                IdenticonCacheService,
                {
                    provide: AddressBookService,
                    useValue: addressBookMock,
                },
            ],
            imports: [
                MaterialComponentsModule,
                ClipboardModule,
                HttpClientTestingModule,
                NoopAnimationsModule,
                RaidenIconsModule,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChannelComponent);
        component = fixture.componentInstance;

        component.channel = channel;
        dialog = (<unknown>TestBed.inject(MatDialog)) as MockMatDialog;
        raidenService = TestBed.inject(RaidenService);
        contacts = {};

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open deposit dialog', () => {
        clickElement(fixture.debugElement, '#options');
        fixture.detectChanges();

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const dialogResult: DepositWithdrawDialogResult = {
            tokenAmount: new BigNumber(50),
        };
        dialog.returns = () => dialogResult;
        const depositSpy = spyOn(
            raidenService,
            'modifyDeposit'
        ).and.returnValue(of(null));
        clickElement(fixture.debugElement, '#deposit');

        const payload: DepositWithdrawDialogPayload = {
            channel: channel,
            depositMode: DepositMode.DEPOSIT,
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(DepositWithdrawDialogComponent, {
            data: payload,
            width: '360px',
        });
        expect(depositSpy).toHaveBeenCalledTimes(1);
        expect(depositSpy).toHaveBeenCalledWith(
            token.address,
            channel.partner_address,
            dialogResult.tokenAmount,
            DepositMode.DEPOSIT
        );
    });

    it('should open withdraw dialog', () => {
        clickElement(fixture.debugElement, '#options');
        fixture.detectChanges();

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const dialogResult: DepositWithdrawDialogResult = {
            tokenAmount: new BigNumber(225),
        };
        dialog.returns = () => dialogResult;
        const depositSpy = spyOn(
            raidenService,
            'modifyDeposit'
        ).and.returnValue(of(null));
        clickElement(fixture.debugElement, '#withdraw');

        const payload: DepositWithdrawDialogPayload = {
            channel: channel,
            depositMode: DepositMode.WITHDRAW,
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(DepositWithdrawDialogComponent, {
            data: payload,
            width: '360px',
        });
        expect(depositSpy).toHaveBeenCalledTimes(1);
        expect(depositSpy).toHaveBeenCalledWith(
            token.address,
            channel.partner_address,
            dialogResult.tokenAmount,
            DepositMode.WITHDRAW
        );
    });

    it('should not deposit if dialog is cancelled', () => {
        clickElement(fixture.debugElement, '#options');
        fixture.detectChanges();

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        dialog.returns = () => null;
        const depositSpy = spyOn(
            raidenService,
            'modifyDeposit'
        ).and.returnValue(of(null));
        clickElement(fixture.debugElement, '#deposit');

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(depositSpy).toHaveBeenCalledTimes(0);
    });

    it('should open close dialog', () => {
        clickElement(fixture.debugElement, '#options');
        fixture.detectChanges();

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const closeSpy = spyOn(raidenService, 'closeChannel').and.returnValue(
            of(null)
        );
        clickElement(fixture.debugElement, '#close');

        const payload: ConfirmationDialogPayload = {
            title: 'Close Channel',
            message: `Are you sure you want to close the ${token.symbol} channel with ${channel.partner_address} in ${token.name} network?`,
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(ConfirmationDialogComponent, {
            data: payload,
            width: '360px',
        });
        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith(
            token.address,
            channel.partner_address
        );
    });

    it('should not close channel if dialog is cancelled', () => {
        clickElement(fixture.debugElement, '#options');
        fixture.detectChanges();

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        dialog.returns = () => null;
        const closeSpy = spyOn(raidenService, 'closeChannel').and.returnValue(
            of(null)
        );
        clickElement(fixture.debugElement, '#close');

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledTimes(0);
    });

    it('should have partner label in close dialog', () => {
        contacts = { [channel.partner_address]: 'Test partner' };
        clickElement(fixture.debugElement, '#options');
        fixture.detectChanges();

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        dialog.returns = () => null;
        clickElement(fixture.debugElement, '#close');

        const payload: ConfirmationDialogPayload = {
            title: 'Close Channel',
            message: `Are you sure you want to close the ${token.symbol} channel with Test partner ${channel.partner_address} in ${token.name} network?`,
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(ConfirmationDialogComponent, {
            data: payload,
            width: '360px',
        });
    });
});
