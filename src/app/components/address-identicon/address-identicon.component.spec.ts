import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { AddressIdenticonComponent } from './address-identicon.component';
import { createAddress } from '../../../testing/test-data';
import { IdenticonCacheService } from '../../services/identicon-cache.service';
import { TestProviders } from '../../../testing/test-providers';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { ClipboardModule } from 'ngx-clipboard';

describe('AddressIdenticonComponent', () => {
    let component: AddressIdenticonComponent;
    let fixture: ComponentFixture<AddressIdenticonComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [AddressIdenticonComponent],
                providers: [
                    IdenticonCacheService,
                    TestProviders.AddressBookStubProvider(),
                ],
                imports: [MaterialComponentsModule, ClipboardModule],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(AddressIdenticonComponent);
        component = fixture.componentInstance;
        component.address = createAddress();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
