import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TokenInputComponent } from '../token-input/token-input.component';

import {
    ConnectionManagerDialogComponent,
    ConnectionManagerDialogPayload
} from './connection-manager-dialog.component';
import { By } from '@angular/platform-browser';
import { TestProviders } from '../../../testing/test-providers';
import BigNumber from 'bignumber.js';
import { MatDialogContent } from '@angular/material/dialog';
import { mockFormInput } from '../../../testing/interaction-helper';
import { BigNumberConversionDirective } from '../../directives/big-number-conversion.directive';

describe('ConnectionManagerDialogComponent', () => {
    let component: ConnectionManagerDialogComponent;
    let fixture: ComponentFixture<ConnectionManagerDialogComponent>;

    beforeEach(async(() => {
        const payload: ConnectionManagerDialogPayload = {
            join: true,
            decimals: 8,
            funds: new BigNumber(0),
            tokenAddress: ''
        };

        TestBed.configureTestingModule({
            declarations: [
                ConnectionManagerDialogComponent,
                TokenInputComponent,
                BigNumberConversionDirective
            ],
            providers: [
                TestProviders.HammerJSProvider(),
                TestProviders.MockMatDialogData(payload),
                TestProviders.MockMatDialogRef({ close: () => {} })
            ],
            imports: [
                MaterialComponentsModule,
                ReactiveFormsModule,
                NoopAnimationsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ConnectionManagerDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should have join if it is a join dialog', () => {
        fixture.detectChanges();
        expect(
            (fixture.debugElement.query(By.css('h1'))
                .nativeElement as HTMLHeadingElement).innerText
        ).toContain('Join');
        expect(
            (fixture.debugElement.queryAll(By.css('button'))[1]
                .nativeElement as HTMLButtonElement).innerText
        ).toContain('Join');
    });

    it('should have add if it is a add dialog', () => {
        component.data.join = false;
        fixture.detectChanges();
        expect(
            (fixture.debugElement.query(By.css('h1'))
                .nativeElement as HTMLHeadingElement).innerText
        ).toContain('Add');
        expect(
            (fixture.debugElement.queryAll(By.css('button'))[1]
                .nativeElement as HTMLButtonElement).innerText
        ).toContain('Add');
    });

    it('should submit the dialog by enter', () => {
        mockFormInput(
            fixture.debugElement.query(By.directive(TokenInputComponent)),
            'inputControl',
            '10'
        );
        const close = spyOn(component.dialogRef, 'close');
        const dialog = fixture.debugElement.query(
            By.directive(MatDialogContent)
        );
        dialog.triggerEventHandler('keyup.enter', {});
        expect(close).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledWith({
            tokenAddress: '',
            funds: new BigNumber(1000000000),
            decimals: 8,
            join: true
        });
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
