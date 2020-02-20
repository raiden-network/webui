import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactActionsComponent } from './contact-actions.component';
import { MaterialComponentsModule } from '../../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RaidenIconsModule } from '../../../modules/raiden-icons/raiden-icons.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestProviders } from '../../../../testing/test-providers';
import { PendingTransferPollingService } from '../../../services/pending-transfer-polling.service';
import { RaidenService } from '../../../services/raiden.service';
import { SelectedTokenService } from '../../../services/selected-token.service';
import { ChannelPollingService } from '../../../services/channel-polling.service';
import { Contact } from '../../../models/contact';
import {
    createAddress,
    createTestChannels,
    createToken
} from '../../../../testing/test-data';
import { BehaviorSubject, of } from 'rxjs';
import { Channel } from '../../../models/channel';
import { By } from '@angular/platform-browser';
import { MockMatDialog } from '../../../../testing/mock-mat-dialog';
import { MatDialog } from '@angular/material/dialog';
import {
    PaymentDialogPayload,
    PaymentDialogComponent
} from '../../payment-dialog/payment-dialog.component';
import BigNumber from 'bignumber.js';
import { clickElement } from '../../../../testing/interaction-helper';
import { AddressBookService } from '../../../services/address-book.service';
import {
    AddEditContactDialogPayload,
    AddEditContactDialogComponent
} from '../../add-edit-contact-dialog/add-edit-contact-dialog.component';
import {
    ConfirmationDialogPayload,
    ConfirmationDialogComponent
} from '../../confirmation-dialog/confirmation-dialog.component';

describe('ContactActionsComponent', () => {
    let component: ContactActionsComponent;
    let fixture: ComponentFixture<ContactActionsComponent>;

    let selectedTokenService: SelectedTokenService;
    let dialog: MockMatDialog;
    let raidenService: RaidenService;
    let channelsSubject: BehaviorSubject<Channel[]>;
    const contact: Contact = {
        address: createAddress(),
        label: 'Test account'
    };
    const token = createToken();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ContactActionsComponent],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider(),
                TestProviders.MockMatDialog(),
                PendingTransferPollingService,
                RaidenService,
                SelectedTokenService,
                ChannelPollingService
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                RaidenIconsModule,
                HttpClientTestingModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ContactActionsComponent);
        component = fixture.componentInstance;

        const channelPollingService: ChannelPollingService = TestBed.inject(
            ChannelPollingService
        );
        channelsSubject = new BehaviorSubject(createTestChannels());
        spyOn(channelPollingService, 'channels').and.returnValue(
            channelsSubject.asObservable()
        );
        selectedTokenService = TestBed.inject(SelectedTokenService);
        dialog = (<unknown>TestBed.inject(MatDialog)) as MockMatDialog;
        raidenService = TestBed.inject(RaidenService);

        component.contact = contact;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        fixture.destroy();
    });

    it('should disable transfer button if has no open channels for selected token', () => {
        selectedTokenService.setToken(token);
        fixture.detectChanges();
        const button = fixture.debugElement.query(By.css('#transfer'));
        expect(button.nativeElement.disabled).toBe(true);
    });

    it('should disable transfer button if has no open channels at all', () => {
        channelsSubject.next([]);
        fixture.detectChanges();
        const button = fixture.debugElement.query(By.css('#transfer'));
        expect(button.nativeElement.disabled).toBe(true);
    });

    it('should open payment dialog', () => {
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const dialogResult: PaymentDialogPayload = {
            tokenAddress: token.address,
            targetAddress: contact.address,
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
            targetAddress: contact.address,
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

    it('should open payment dialog with selected token', () => {
        const connectedToken = createToken({
            connected: {
                channels: 1,
                funds: new BigNumber(0),
                sum_deposits: new BigNumber(0)
            }
        });
        selectedTokenService.setToken(connectedToken);
        fixture.detectChanges();

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        dialog.returns = () => null;
        clickElement(fixture.debugElement, '#transfer');

        const payload: PaymentDialogPayload = {
            tokenAddress: connectedToken.address,
            targetAddress: contact.address,
            amount: undefined
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(PaymentDialogComponent, {
            data: payload,
            width: '360px'
        });
    });

    it('should open edit contact dialog', () => {
        const addressBookService = TestBed.inject(AddressBookService);

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const dialogResult: Contact = {
            address: contact.address,
            label: 'New label'
        };
        dialog.returns = () => dialogResult;
        const saveSpy = spyOn(addressBookService, 'save');
        clickElement(fixture.debugElement, '#edit');

        const payload: AddEditContactDialogPayload = {
            address: contact.address,
            label: contact.label,
            edit: true
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(AddEditContactDialogComponent, {
            data: payload,
            width: '360px'
        });
        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(saveSpy).toHaveBeenCalledWith(dialogResult);
    });

    it('should open delete contact dialog', () => {
        const addressBookService = TestBed.inject(AddressBookService);

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const deleteSpy = spyOn(addressBookService, 'delete');
        clickElement(fixture.debugElement, '#delete');

        const payload: ConfirmationDialogPayload = {
            title: 'Delete Contact',
            message: `Are you sure you want to delete the contact ${
                contact.label
            } for address ${contact.address}?`
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(ConfirmationDialogComponent, {
            data: payload,
            width: '360px'
        });
        expect(deleteSpy).toHaveBeenCalledTimes(1);
        expect(deleteSpy).toHaveBeenCalledWith(contact);
    });
});
