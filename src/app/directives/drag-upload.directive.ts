import {
    Directive,
    EventEmitter,
    HostListener,
    Input,
    Output
} from '@angular/core';

export enum DragStatus {
    OVER,
    LEAVE
}

@Directive({
    selector: '[appDragUpload]'
})
export class DragUploadDirective {
    @Input() allowedExtension: string;
    @Output() files: EventEmitter<FileList> = new EventEmitter();
    @Output() dragStatus: EventEmitter<DragStatus> = new EventEmitter();

    constructor() {}

    @HostListener('dragover', ['$event'])
    public onDragOver(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        evt.dataTransfer.dropEffect = 'copy';
        this.dragStatus.emit(DragStatus.OVER);
    }

    @HostListener('dragleave', ['$event'])
    public onDragLeave(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        this.dragStatus.emit(DragStatus.LEAVE);
    }

    @HostListener('drop', ['$event'])
    public onDrop(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        this.files.emit(evt.dataTransfer.files);
    }
}
