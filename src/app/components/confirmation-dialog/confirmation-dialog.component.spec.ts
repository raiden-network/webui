import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import {
    ConfirmationDialogComponent,
    ConfirmationDialogPayload,
} from './confirmation-dialog.component';
import { TestProviders } from '../../../testing/test-providers';
import { clickElement } from '../../../testing/interaction-helper';
import { RaidenDialogComponent } from '../raiden-dialog/raiden-dialog.component';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ConfirmationDialogComponent', () => {
    let component: ConfirmationDialogComponent;
    let fixture: ComponentFixture<ConfirmationDialogComponent>;

    beforeEach(async(() => {
        const payload: ConfirmationDialogPayload = {
            title: 'Test confirm',
            message: 'Do you want to confirm this test?',
        };

        TestBed.configureTestingModule({
            declarations: [ConfirmationDialogComponent, RaidenDialogComponent],
            providers: [
                TestProviders.MockMatDialogData(payload),
                TestProviders.MockMatDialogRef({ close: () => {} }),
            ],
            imports: [
                MaterialComponentsModule,
                ReactiveFormsModule,
                RaidenIconsModule,
                HttpClientTestingModule,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfirmationDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close the dialog with true when confirmed', function () {
        // @ts-ignore
        const closeSpy = spyOn(component.dialogRef, 'close');
        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();

        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith(true);
    });

    it('should close the dialog with no result when cancelled', () => {
        // @ts-ignore
        const closeSpy = spyOn(component.dialogRef, 'close');
        clickElement(fixture.debugElement, '#cancel');
        fixture.detectChanges();

        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith();
    });
});
