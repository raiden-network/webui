import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';

import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { TestProviders } from '../../../testing/test-providers';
import { MatDialogRef } from '@angular/material';

describe('ConfirmationDialogComponent', () => {
    let component: ConfirmationDialogComponent;
    let fixture: ComponentFixture<ConfirmationDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ConfirmationDialogComponent
            ],
            providers: [
                TestProviders.MockMatDialogData(),
                TestProviders.MockMatDialogRef(jasmine.createSpyObj('MatDialogRef', ['close']))
            ],
            imports: [
                MaterialComponentsModule,
                ReactiveFormsModule
            ]
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

    it('should call return true when confirmed', function () {
        const matDialogRef = TestBed.get(MatDialogRef);
        component.confirm();
        expect(matDialogRef.close).toHaveBeenCalledTimes(1);
        expect(matDialogRef.close).toHaveBeenCalledWith(true);
    });
});
