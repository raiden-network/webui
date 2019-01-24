import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TokenInputComponent } from '../token-input/token-input.component';

import { DepositDialogComponent } from './deposit-dialog.component';
import { TestProviders } from '../../../testing/test-providers';

describe('DepositDialogComponent', () => {
    let component: DepositDialogComponent;
    let fixture: ComponentFixture<DepositDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                DepositDialogComponent,
                TokenInputComponent
            ],
            providers: [
                TestProviders.HammerJSProvider(),
                TestProviders.MockMatDialogData(),
                TestProviders.MockMatDialogRef()
            ],
            imports: [
                MaterialComponentsModule,
                ReactiveFormsModule,
                NoopAnimationsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DepositDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
