import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { AddressInputComponent } from '../address-input/address-input.component';

import { RegisterDialogComponent } from './register-dialog.component';
import { TestProviders } from '../../../testing/test-providers';
import { MatDialogContent } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { mockFormInput } from '../../../testing/interaction-helper';

describe('RegisterDialogComponent', () => {
    let component: RegisterDialogComponent;
    let fixture: ComponentFixture<RegisterDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [RegisterDialogComponent, AddressInputComponent],
            providers: [
                TestProviders.MockMatDialogData(),
                TestProviders.MockMatDialogRef({ close: () => {} }),
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider()
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                ReactiveFormsModule,
                HttpClientTestingModule
            ]
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

    it('should submit the dialog by enter', () => {
        mockFormInput(
            fixture.debugElement.query(By.directive(AddressInputComponent)),
            'inputFieldFc',
            '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
        );
        const close = spyOn(component.dialogRef, 'close');
        const dialog = fixture.debugElement.query(
            By.directive(MatDialogContent)
        );
        dialog.triggerEventHandler('keyup.enter', {});
        expect(close).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledWith(
            '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
        );
    });

    it('should not submit the dialog by enter if the form is invalid', () => {
        const close = spyOn(component.dialogRef, 'close');
        const dialog = fixture.debugElement.query(
            By.directive(MatDialogContent)
        );
        dialog.triggerEventHandler('keyup.enter', {});
        expect(close).toHaveBeenCalledTimes(0);
    });
});
