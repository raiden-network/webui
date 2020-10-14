import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { QrCodeComponent, QrCodePayload } from './qr-code.component';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { ClipboardModule } from 'ngx-clipboard';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TestProviders } from '../../../testing/test-providers';
import { createAddress } from '../../../testing/test-data';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { clickElement } from '../../../testing/interaction-helper';
import * as QRCode from 'qrcode';
import Spy = jasmine.Spy;
import { By } from '@angular/platform-browser';
import { RaidenDialogComponent } from '../raiden-dialog/raiden-dialog.component';

describe('QrCodeComponent', () => {
    let component: QrCodeComponent;
    let fixture: ComponentFixture<QrCodeComponent>;

    const content = createAddress();
    let qrCodeSpy: Spy;

    beforeEach(
        waitForAsync(() => {
            const payload: QrCodePayload = {
                content: content,
            };

            TestBed.configureTestingModule({
                declarations: [QrCodeComponent, RaidenDialogComponent],
                providers: [
                    TestProviders.MockMatDialogData(payload),
                    TestProviders.MockMatDialogRef({ close: () => {} }),
                ],
                imports: [
                    ClipboardModule,
                    RaidenIconsModule,
                    MaterialComponentsModule,
                    HttpClientTestingModule,
                ],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        qrCodeSpy = spyOn(QRCode, 'toCanvas');
        fixture = TestBed.createComponent(QrCodeComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should display the qr code', () => {
        fixture.detectChanges();
        const canvas = fixture.debugElement.query(By.css('canvas'));
        expect(qrCodeSpy).toHaveBeenCalledTimes(1);
        expect(qrCodeSpy).toHaveBeenCalledWith(canvas.nativeElement, content, {
            width: 188,
        });
    });

    it('should log errors during qr code generation', () => {
        qrCodeSpy.and.callFake(() => {
            throw new Error('QR code generation error.');
        });
        const consoleSpy = spyOn(console, 'error');
        fixture.detectChanges();
        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should close the dialog when close button is clicked', () => {
        fixture.detectChanges();

        // @ts-ignore
        const closeSpy = spyOn(component.dialogRef, 'close');
        clickElement(fixture.debugElement, '#close');
        fixture.detectChanges();

        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith();
    });
});
