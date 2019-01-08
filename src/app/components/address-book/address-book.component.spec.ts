import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressBookComponent } from './address-book.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { AddressBookItemComponent } from '../address-book-item/address-book-item.component';
import { DragUploadDirective } from '../../directives/drag-upload.directive';
import { LocalStorageAdapter } from '../../adapters/local-storage-adapter';
import { storageMock } from '../../../testing/mock-storage';

describe('AddressBookComponent', () => {
    let component: AddressBookComponent;
    let fixture: ComponentFixture<AddressBookComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                AddressBookComponent,
                AddressBookItemComponent,
                DragUploadDirective
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                ReactiveFormsModule
            ],
            providers: [
                {
                    provide: LocalStorageAdapter,
                    useFactory: () => {
                        const storage = storageMock();
                        return {
                            get localStorage(): Storage {
                                return storage;
                            }
                        };
                    }
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddressBookComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
