import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactsPageComponent } from './contacts-page.component';
import { ContactListComponent } from '../contact-list/contact-list.component';
import { ContactComponent } from '../contact/contact.component';
import { ContactActionsComponent } from '../contact/contact-actions/contact-actions.component';
import { TestProviders } from '../../../testing/test-providers';
import { NotificationService } from '../../services/notification.service';
import { SharedService } from '../../services/shared.service';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrModule } from 'ngx-toastr';
import { ClipboardModule } from 'ngx-clipboard';
import { ChunkPipe } from '../../pipes/chunk.pipe';

describe('ContactsPageComponent', () => {
    let component: ContactsPageComponent;
    let fixture: ComponentFixture<ContactsPageComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [
                    ContactsPageComponent,
                    ContactListComponent,
                    ContactComponent,
                    ContactActionsComponent,
                    ChunkPipe,
                ],
                providers: [
                    TestProviders.MockRaidenConfigProvider(),
                    TestProviders.AddressBookStubProvider(),
                    TestProviders.MockMatDialog(),
                    NotificationService,
                    SharedService,
                ],
                imports: [
                    MaterialComponentsModule,
                    NoopAnimationsModule,
                    RaidenIconsModule,
                    HttpClientTestingModule,
                    ToastrModule.forRoot(),
                    ClipboardModule,
                ],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ContactsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        fixture.destroy();
    });
});
