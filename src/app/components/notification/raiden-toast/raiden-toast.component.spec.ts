import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RaidenToastComponent } from './raiden-toast.component';
import { ToastrModule, ToastPackage, ToastRef } from 'ngx-toastr';

describe('RaidenToastComponent', () => {
    let component: RaidenToastComponent;
    let fixture: ComponentFixture<RaidenToastComponent>;

    const toastPackageMock = {
        toastId: 1,
        toastType: 'success',
        afterActivate: jasmine.createSpy('afterActivate'),
        config: { toastClass: 'custom-toast' },
        message: 'test message',
        title: 'test title',
        toastRef: new ToastRef(null),
    };

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [RaidenToastComponent],
                providers: [
                    { provide: ToastPackage, useValue: toastPackageMock },
                ],
                imports: [NoopAnimationsModule, ToastrModule.forRoot()],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(RaidenToastComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
