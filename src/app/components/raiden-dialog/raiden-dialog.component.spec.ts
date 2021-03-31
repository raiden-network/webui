import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RaidenDialogComponent } from './raiden-dialog.component';
import { clickElement } from '../../../testing/interaction-helper';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('RaidenDialogComponent', () => {
    let component: RaidenDialogComponent;
    let fixture: ComponentFixture<RaidenDialogComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [RaidenDialogComponent],
                imports: [
                    RaidenIconsModule,
                    MaterialComponentsModule,
                    HttpClientTestingModule,
                ],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(RaidenDialogComponent);
        component = fixture.componentInstance;
        component.acceptDisabled = false;
        component.acceptText = 'Submit';
        component.titleText = 'Raiden Dialog';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should cancel the dialog by clicking the X icon', () => {
        const cancelSpy = jasmine.createSpy('cancel');
        component.cancel.subscribe(cancelSpy);

        clickElement(fixture.debugElement, '#close');

        expect(cancelSpy).toHaveBeenCalledTimes(1);
    });
});
