import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { ContactListComponent } from '../contact-list/contact-list.component';
import { HistoryTableComponent } from '../history-table/history-table.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { ClipboardModule } from 'ngx-clipboard';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { TestProviders } from '../../../testing/test-providers';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { TokenComponent } from '../token/token.component';
import { ContactComponent } from '../contact/contact.component';
import { ContactActionsComponent } from '../contact/contact-actions/contact-actions.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TokenPipe } from '../../pipes/token.pipe';

describe('HomeComponent', () => {
    let component: HomeComponent;
    let fixture: ComponentFixture<HomeComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                HomeComponent,
                ContactListComponent,
                HistoryTableComponent,
                DecimalPipe,
                DisplayDecimalsPipe,
                TokenComponent,
                ContactComponent,
                ContactActionsComponent,
                TokenPipe,
            ],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider(),
            ],
            imports: [
                MaterialComponentsModule,
                ClipboardModule,
                HttpClientTestingModule,
                RaidenIconsModule,
                NoopAnimationsModule,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
