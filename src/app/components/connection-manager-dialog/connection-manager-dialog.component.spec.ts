import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TokenInputComponent } from '../token-input/token-input.component';

import { ConnectionManagerDialogComponent } from './connection-manager-dialog.component';
import { By } from '@angular/platform-browser';

describe('ConnectionManagerDialogComponent', () => {
    let component: ConnectionManagerDialogComponent;
    let fixture: ComponentFixture<ConnectionManagerDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ConnectionManagerDialogComponent,
                TokenInputComponent
            ],
            providers: [
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {}
                },
                {
                    provide: MatDialogRef,
                    useValue: {}
                }
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
        component.data = {
            join: true,
            decimals: 18,
            funds: 0,
            tokenAddress: ''
        };

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

    it('should have join if it is a join dialog', () => {
        component.data = {
            join: false,
            decimals: 18,
            funds: 0,
            tokenAddress: ''
        };

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
});
