import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { AddressInputComponent } from '../address-input/address-input.component';
import { RegisterDialogComponent } from './register-dialog.component';
import { TestProviders } from '../../../testing/test-providers';
import { RaidenDialogComponent } from '../raiden-dialog/raiden-dialog.component';
import { createAddress } from '../../../testing/test-data';
import { mockInput, clickElement } from '../../../testing/interaction-helper';
import { By } from '@angular/platform-browser';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';

describe('RegisterDialogComponent', () => {
    let component: RegisterDialogComponent;
    let fixture: ComponentFixture<RegisterDialogComponent>;

    const addressInput = createAddress();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                RegisterDialogComponent,
                AddressInputComponent,
                RaidenDialogComponent,
            ],
            providers: [
                TestProviders.MockMatDialogData(),
                TestProviders.MockMatDialogRef({ close: () => {} }),
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider(),
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                ReactiveFormsModule,
                HttpClientTestingModule,
                RaidenIconsModule,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(RegisterDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should close the dialog with the result when accept button is clicked', () => {
        mockInput(
            fixture.debugElement.query(By.directive(AddressInputComponent)),
            'input',
            addressInput
        );
        fixture.detectChanges();

        // @ts-ignore
        const closeSpy = spyOn(component.dialogRef, 'close');
        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();

        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith(addressInput);
    });

    it('should close the dialog with no result when cancel button is clicked', () => {
        mockInput(
            fixture.debugElement.query(By.directive(AddressInputComponent)),
            'input',
            addressInput
        );
        fixture.detectChanges();

        // @ts-ignore
        const closeSpy = spyOn(component.dialogRef, 'close');
        clickElement(fixture.debugElement, '#cancel');
        fixture.detectChanges();

        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith();
    });
});
