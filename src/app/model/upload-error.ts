export interface UploadError {
    readonly multiple?: boolean;
    readonly invalidExtension?: boolean;
    readonly invalidFormat?: boolean;
    readonly exceedsUploadLimit?: number;
}
