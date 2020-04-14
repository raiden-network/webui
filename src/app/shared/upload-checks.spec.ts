import { UploadChecks } from './upload-checks';
import { stub } from '../../testing/stub';

describe('UploadChecks', () => {
    it('should create an instance', () => {
        expect(new UploadChecks()).toBeTruthy();
    });

    it('should emit an error if more than one file is passed', function () {
        const fileList = stub<FileList>();
        // @ts-ignore
        fileList.length = 5;

        try {
            UploadChecks.check(fileList, 'json');
            fail('there should be an error thrown');
        } catch (e) {
            expect(e.error).toEqual({ multiple: true });
        }
    });

    it('should do nothing if no files are passed', function () {
        const fileList = stub<FileList>();
        // @ts-ignore
        fileList.length = 0;

        const file = UploadChecks.check(fileList, 'json');
        expect(file).toBeNull();
    });

    it('should emit an error if an invalid extension is passed', function () {
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

        try {
            UploadChecks.check(fileList, 'json');
            fail('There should be an error thrown');
        } catch (e) {
            expect(e.error).toEqual({ invalidExtension: true });
        }
    });

    it('should emit an error if file is too large', function () {
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

        try {
            UploadChecks.check(fileList, 'json');
            fail('There should be an error');
        } catch (e) {
            expect(e.error).toEqual({ exceedsUploadLimit: 262144 });
        }
    });

    it('should emit the file if no errors exists', function () {
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

        const returnedFile = UploadChecks.check(fileList, 'json');
        expect(returnedFile.name).toBe('address.json');
        expect(returnedFile.size).toBe(120 * 1024);
    });
});
