import {
    async,
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
    flush
} from '@angular/core/testing';
import { RaidenDialogComponent } from './raiden-dialog.component';
import { By } from '@angular/platform-browser';

describe('RaidenDialogComponent', () => {
    let component: RaidenDialogComponent;
    let fixture: ComponentFixture<RaidenDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [RaidenDialogComponent]
        }).compileComponents();
    }));

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

    it('should submit on enter', fakeAsync(() => {
        const acceptSpy = jasmine.createSpy('accept');
        component.accept.subscribe(acceptSpy);

        const dialog = fixture.debugElement.query(By.css('.dialog'));
        dialog.triggerEventHandler('keyup.enter', {});
        tick();

        expect(acceptSpy).toHaveBeenCalledTimes(1);
        flush();
    }));

    it('should not submit on enter when accept disabled', fakeAsync(() => {
        component.acceptDisabled = true;
        fixture.detectChanges();

        const acceptSpy = jasmine.createSpy('accept');
        component.accept.subscribe(acceptSpy);

        const dialog = fixture.debugElement.query(By.css('.dialog'));
        dialog.triggerEventHandler('keyup.enter', {});
        tick();

        expect(acceptSpy).toHaveBeenCalledTimes(0);
        flush();
    }));
});
