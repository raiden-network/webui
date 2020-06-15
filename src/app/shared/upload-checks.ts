import { UploadError } from '../models/upload-error';

export class UploadCheckError extends Error {
    constructor(public readonly error: UploadError) {
        super(JSON.stringify(error));
    }
}

export class UploadChecks {
    public static MAX_UPLOAD_SIZE = 256 * 1024;

    static check(files: FileList, extension: string): File {
        if (files.length > 1) {
            throw new UploadCheckError({ multiple: true });
        }

        if (files.length <= 0) {
            return null;
        }

        const file = files.item(0);

        if (extension && !file.name.endsWith(extension)) {
            throw new UploadCheckError({ invalidExtension: true });
        }

        if (file.size > UploadChecks.MAX_UPLOAD_SIZE) {
            throw new UploadCheckError({
                exceedsUploadLimit: UploadChecks.MAX_UPLOAD_SIZE,
            });
        }

        return file;
    }
}
