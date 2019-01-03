import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressBookComponent } from './address-book.component';
import { MaterialComponentsModule } from "../../modules/material-components/material-components.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ReactiveFormsModule } from "@angular/forms";
import { AddressBookAddress } from "../address-book-address/address-book-address.component";
import { DragUploadDirective } from "../../directives/drag-upload.directive";
import { LocalStorageAdapter } from "../../adapters/local-storage-adapter";
import { storageMock } from "../../../testing/mock-storage";

describe('AddressBookComponent', () => {
    let component: AddressBookComponent;
    let fixture: ComponentFixture<AddressBookComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                AddressBookComponent,
                AddressBookAddress,
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
                        let storage = storageMock();
                        return {
                            get localStorage(): Storage {
                                return storage
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
