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

    it('should emit an error if more than one file is passed', function (done) {
        const directive = new DragUploadDirective();
        const event: DragEvent = jasmine.createSpyObj('DragEvent', ['preventDefault', 'stopPropagation', 'dataTransfer']);
        directive.error.subscribe(error => {
            expect(error).toEqual({multiple: true});
            done();
        });

        const fileList = stub<FileList>();
        // @ts-ignore
        fileList.length = 5;
        // @ts-ignore
        event.dataTransfer.files = fileList;

        directive.onDrop(event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    });

    it('should do nothing if no files are passed', function () {
        const directive = new DragUploadDirective();
        const event: DragEvent = jasmine.createSpyObj('DragEvent', ['preventDefault', 'stopPropagation', 'dataTransfer']);
        directive.error.subscribe(() => {
            fail('There should be no error thrown');
        });

        const fileList = stub<FileList>();
        // @ts-ignore
        fileList.length = 0;
        // @ts-ignore
        event.dataTransfer.files = fileList;

        directive.onDrop(event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    });

    it('should emit an error if an invalid extension is passed', function (done) {
        const directive = new DragUploadDirective();
        directive.allowedExtension = 'json';
        const event: DragEvent = jasmine.createSpyObj('DragEvent', ['preventDefault', 'stopPropagation', 'dataTransfer']);
        directive.error.subscribe(error => {
            expect(error).toEqual({invalidExtension: true});
            done();
        });

        const fileList: FileList = stub<FileList>();
        // @ts-ignore
        fileList.length = 1;
        // @ts-ignore
        fileList.item = function () {
            const file = stub<File>();
            // @ts-ignore
            file.name = 'photo.png';
            return file;
        };
        // @ts-ignore
        event.dataTransfer.files = fileList;
        directive.onDrop(event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    });

    it('should emit an error if file is too large', function (done) {
        const directive = new DragUploadDirective();
        directive.allowedExtension = 'json';
        const event: DragEvent = jasmine.createSpyObj('DragEvent', ['preventDefault', 'stopPropagation', 'dataTransfer']);
        directive.error.subscribe(error => {
            expect(error).toEqual({exceedsUploadLimit: 262144});
            done();
        });

        const fileList: FileList = stub<FileList>();
        // @ts-ignore
        fileList.length = 1;
        // @ts-ignore
        fileList.item = function () {
            const file = stub<File>();
            // @ts-ignore
            file.name = 'address.json';
            // @ts-ignore
            file.size = 1024 * 1024;
            return file;
        };
        // @ts-ignore
        event.dataTransfer.files = fileList;
        directive.onDrop(event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    });

    it('should emit the file if no errors exists', function (done) {
        const directive = new DragUploadDirective();
        directive.allowedExtension = 'json';
        const event: DragEvent = jasmine.createSpyObj('DragEvent', ['preventDefault', 'stopPropagation', 'dataTransfer']);
        directive.error.subscribe(() => {
            fail('There should be no error');
        });

        directive.selectedFile.subscribe(file => {
            expect(file.name).toBe('address.json');
            expect(file.size).toBe(120 * 1024);
            done();
        });

        const fileList: FileList = stub<FileList>();
        // @ts-ignore
        fileList.length = 1;
        // @ts-ignore
        fileList.item = function () {
            const file = stub<File>();
            // @ts-ignore
            file.name = 'address.json';
            // @ts-ignore
            file.size = 120 * 1024;
            return file;
        };
        // @ts-ignore
        event.dataTransfer.files = fileList;
        directive.onDrop(event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    });
});

