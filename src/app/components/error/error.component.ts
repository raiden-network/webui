import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConnectionErrorType } from '../../models/connection-errors';
import { RaidenService } from '../../services/raiden.service';

export interface ErrorPayload {
    type: ConnectionErrorType;
    errorContent: string;
}

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.css']
})
export class ErrorComponent {
    showError = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ErrorPayload,
        private raidenService: RaidenService
    ) {}

    isRpcError(): boolean {
        return this.data.type === ConnectionErrorType.RpcError;
    }

    retry() {
        if (this.isRpcError()) {
            this.raidenService.attemptRpcConnection();
        } else {
            this.raidenService.attemptApiConnection();
        }
    }
}
