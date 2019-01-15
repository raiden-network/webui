import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UploadError } from '../../models/upload-error';
import { UploadChecks } from '../../shared/upload-checks';
import { Addresses } from '../../models/address';
import { DragStatus } from '../../directives/drag-upload.directive';
import { addressSchema } from '../../models/address-schema';
import { ValidateFunction } from 'ajv';
import * as Ajv from 'ajv';

@Component({
    selector: 'app-file-upload',
    exportAs: 'file-upload',
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {

    @Input() showDropArea = false;
    @Output() addresses: EventEmitter<Addresses> = new EventEmitter();

    private _error: UploadError = null;
    private _isOver = false;
    private _progress: number;

    public get isOver(): boolean {
        return this._isOver;
    }

    public get error(): UploadError {
        return this._error;
    }

    public get progress(): number {
        return this._progress;
    }

    private uploadChecks: UploadChecks;
    private readonly schema: ValidateFunction;

    constructor() {
        this.uploadChecks = new UploadChecks();
        const validator = new Ajv({allErrors: true});
        this.schema = validator.compile(addressSchema);
    }

    filesSelected(files: FileList) {
        try {
            const file = UploadChecks.check(files, 'json');
            this.upload(file);
        } catch (e) {
            this._error = e.error;
        }
    }

    private upload(file: File) {
        this._error = null;

        const reader = new FileReader();
        reader.onload = () => {
            const json = JSON.parse(reader.result as string);

            if (this.schema(json)) {
                this.addresses.emit(json);

                setTimeout(() => {
                    this.showDropArea = false;
                    this._isOver = false;
                    this._progress = 0;
                }, 800);
            } else {
                this._error = {invalidFormat: true};
            }
        };

        reader.onprogress = ev => {
            this._progress = (ev.loaded / ev.total * 100);
        };

        reader.readAsText(file);
    }

    updateDragStatus(status: DragStatus) {
        this._isOver = status === DragStatus.OVER;
    }
}
