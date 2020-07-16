import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactComponent } from './contact.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { ContactActionsComponent } from './contact-actions/contact-actions.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Contact } from '../../models/contact';
import { createAddress } from '../../../testing/test-data';
import { ClipboardModule } from 'ngx-clipboard';
import { clickElement } from '../../../testing/interaction-helper';
import { SharedService } from '../../services/shared.service';
import { TestProviders } from '../../../testing/test-providers';
import { By } from '@angular/platform-browser';
import { AddressIdenticonComponent } from '../address-identicon/address-identicon.component';

describe('ContactComponent', () => {
    let component: ContactComponent;
    let fixture: ComponentFixture<ContactComponent>;

    const contact: Contact = {
        address: createAddress(),
        label: 'Test account',
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ContactComponent,
                ContactActionsComponent,
                AddressIdenticonComponent,
            ],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                SharedService,
                TestProviders.AddressBookStubProvider(),
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                RaidenIconsModule,
                HttpClientTestingModule,
                ClipboardModule,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ContactComponent);
        component = fixture.componentInstance;
        component.contact = contact;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should select a contact on click', () => {
        clickElement(fixture.debugElement, '.card');
        fixture.detectChanges();
        expect(component.selected).toBe(true);
    });

    it('should deselect the contact on a second click', () => {
        clickElement(fixture.debugElement, '.card');
        fixture.detectChanges();
        clickElement(fixture.debugElement, '.card');
        fixture.detectChanges();
        expect(component.selected).toBe(false);
    });

    it('should deselect the contact when clicked elsewhere', () => {
        const sharedService = TestBed.inject(SharedService);
        clickElement(fixture.debugElement, '.card');
        fixture.detectChanges();
        sharedService.newGlobalClick(document.createElement('div'));
        fixture.detectChanges();
        expect(component.selected).toBe(false);
    });

    it('should not deselect when global click emits the card as target', () => {
        const sharedService = TestBed.inject(SharedService);
        clickElement(fixture.debugElement, '.card');
        fixture.detectChanges();
        const card = fixture.debugElement.query(By.css('.card')).nativeElement;
        sharedService.newGlobalClick(card);
        fixture.detectChanges();
        expect(component.selected).toBe(true);
    });
});
