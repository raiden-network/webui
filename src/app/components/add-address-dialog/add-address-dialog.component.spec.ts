import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAddressDialogComponent } from './add-address-dialog.component';
import { AddressInputComponent } from '../address-input/address-input.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestProviders } from '../../../testing/test-providers';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SharedService } from '../../services/shared.service';
import { LocalStorageAdapter } from '../../adapters/local-storage-adapter';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AddAddressDialogComponent', () => {
    let component: AddAddressDialogComponent;
    let fixture: ComponentFixture<AddAddressDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AddAddressDialogComponent, AddressInputComponent],
            providers: [
                TestProviders.MockMatDialogRef(),
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.HammerJSProvider(),
                SharedService,
                {
                    provide: LocalStorageAdapter,
                    useValue: {}
                }
            ],
            imports: [
                MaterialComponentsModule,
                FormsModule,
                ReactiveFormsModule,
                HttpClientTestingModule,
                NoopAnimationsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddAddressDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
