import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactComponent } from './contact.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { ContactActionsComponent } from './contact-actions/contact-actions.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Contact } from '../../models/contact';
import { createAddress } from '../../../testing/test-data';

describe('ContactComponent', () => {
    let component: ContactComponent;
    let fixture: ComponentFixture<ContactComponent>;

    const contact: Contact = {
        address: createAddress(),
        label: 'Test account',
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ContactComponent, ContactActionsComponent],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                RaidenIconsModule,
                HttpClientTestingModule,
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
});
