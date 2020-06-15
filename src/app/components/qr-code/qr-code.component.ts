import {
    Component,
    OnInit,
    Inject,
    ViewChild,
    ElementRef,
    AfterViewInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as QRCode from 'qrcode';

export interface QrCodePayload {
    content: string;
}

@Component({
    selector: 'app-qr-code',
    templateUrl: './qr-code.component.html',
    styleUrls: ['./qr-code.component.css'],
})
export class QrCodeComponent implements OnInit, AfterViewInit {
    @ViewChild('canvas', { static: true }) private canvas: ElementRef;
    content = '';

    constructor(
        @Inject(MAT_DIALOG_DATA) data: QrCodePayload,
        private dialogRef: MatDialogRef<QrCodeComponent>
    ) {
        this.content = data.content;
    }

    ngOnInit() {}

    ngAfterViewInit() {
        this.displayQrCode();
    }

    close() {
        this.dialogRef.close();
    }

    private async displayQrCode() {
        try {
            await QRCode.toCanvas(this.canvas.nativeElement, this.content, {
                width: 188,
            });
        } catch (e) {
            console.error(`Error displaying QR code: ${e.message}`);
        }
    }
}
