import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { UploadError } from "../model/upload-error";

@Directive({
    selector: '[appDragUpload]'
})
export class DragUploadDirective {

    public static MAX_UPLOAD_SIZE = 256 * 1024;

    @Input() allowedExtension: string;

    @Output() selectedFile: EventEmitter<File> = new EventEmitter();
    @Output() error: EventEmitter<UploadError> = new EventEmitter();

    constructor() {
    }

    @HostListener('dragover', ['$event'])
    public onDragOver(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        evt.dataTransfer.dropEffect = 'copy';
    }

    @HostListener('dragleave', ['$event'])
    public onDragLeave(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
    }

    @HostListener('drop', ['$event'])
    public onDrop(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        let files = evt.dataTransfer.files;

        if (files.length > 1) {
            this.error.emit({multiple: true});
            return
        }

        if (files.length <= 0) {
            return;
        }

        const file = files.item(0);
        const extension = this.allowedExtension;

        if (extension && !file.name.endsWith(extension)) {
            this.error.emit({invalidExtension: true});
            return
        }

        if (file.size > DragUploadDirective.MAX_UPLOAD_SIZE) {
            this.error.emit({exceedsUploadLimit: DragUploadDirective.MAX_UPLOAD_SIZE});
            return
        }

        this.selectedFile.emit(file)
    }

}
