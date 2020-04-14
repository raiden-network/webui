import { HttpErrorResponse } from '@angular/common/http';

export interface ApiErrorResponse extends HttpErrorResponse {
    retrying?: boolean;
}

export interface ConnectionErrors {
    rpcError?: Error;
    apiError?: ApiErrorResponse;
}

export enum ConnectionErrorType {
    RpcError,
    ApiError,
}
