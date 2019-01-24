import { DragStatus, DragUploadDirective } from './drag-upload.directive';
import { stub } from '../../testing/stub';

describe('DragUploadDirective', () => {
    it('should create an instance', () => {
        const directive = new DragUploadDirective();
        expect(directive).toBeTruthy();
    });

    it('should fire a DragStatus.OVER when the user drags over', function (done) {
        const directive = new DragUploadDirective();
        const event: DragEvent = jasmine.createSpyObj('DragEvent', ['preventDefault', 'stopPropagation', 'dataTransfer']);
        directive.dragStatus.subscribe(value => {
            expect(value).toBe(DragStatus.OVER);
            done();
        });

        directive.onDragOver(event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.stopPropagation).toHaveBeenCalledTimes(1);
        expect(event.dataTransfer.dropEffect).toBe('copy');
    });

    it('should fire a DragStatus.LEAVE when the user leaves', function (done) {
        const directive = new DragUploadDirective();
        const event: DragEvent = jasmine.createSpyObj('DragEvent', ['preventDefault', 'stopPropagation', 'dataTransfer']);
        directive.dragStatus.subscribe(value => {
            expect(value).toBe(DragStatus.LEAVE);
            done();
        });

        directive.onDragLeave(event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    });

    it('should emit the selected files', function (done) {
        const directive = new DragUploadDirective();
        const event: DragEvent = jasmine.createSpyObj('DragEvent', ['preventDefault', 'stopPropagation', 'dataTransfer']);

        const files = stub<FileList>();
        // @ts-ignore
        event.dataTransfer.files = files;

        directive.files.subscribe(value => {
            expect(value).toBe(files);
            done();
        });

        directive.onDrop(event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    });
});

