import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TokenInputComponent } from '../token-input/token-input.component';

import {
    ConnectionManagerDialogComponent,
    ConnectionManagerDialogPayload
} from './connection-manager-dialog.component';
import { TestProviders } from '../../../testing/test-providers';
import BigNumber from 'bignumber.js';

describe('ConnectionManagerDialogComponent', () => {
    let component: ConnectionManagerDialogComponent;
    let fixture: ComponentFixture<ConnectionManagerDialogComponent>;

    beforeEach(async(() => {
        const payload: ConnectionManagerDialogPayload = {
            funds: new BigNumber(0),
            token: undefined
        };

        TestBed.configureTestingModule({
            declarations: [
                ConnectionManagerDialogComponent,
                TokenInputComponent
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
});
