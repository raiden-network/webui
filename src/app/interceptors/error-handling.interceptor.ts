import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpErrorResponse,
    HttpResponse
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import { catchError, tap } from 'rxjs/operators';

import { NotificationService } from '../services/notification.service';
import { UiMessage } from '../models/notification';

@Injectable()
export class ErrorHandlingInterceptor implements HttpInterceptor {
    private raidenApiUnavailable = false;

    constructor(private notificationService: NotificationService) {}

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            tap(event => {
                if (event instanceof HttpResponse) {
                    this.raidenApiUnavailable = false;
                }
            }),
            catchError(error => this.handleError(error))
        );
    }

    private handleError(error: HttpErrorResponse | Error) {
        let errMsg: string;

        if (
            error instanceof HttpErrorResponse &&
            (error.status === 504 || error.status === 0)
        ) {
            errMsg = 'Could not connect to the Raiden API.';
            if (!this.raidenApiUnavailable) {
                this.raidenApiUnavailable = true;
                const notificationMessage: UiMessage = {
                    title: 'API not available',
                    description: errMsg
                };
                this.notificationService.addErrorNotification(
                    notificationMessage
                );
            }

            return throwError(errMsg);
        } else if (error instanceof HttpErrorResponse && error.error.errors) {
            const errors = error.error.errors;

            if (typeof errors === 'string') {
                errMsg = errors;
            } else if (typeof errors === 'object') {
                errMsg = '';

                for (const key in errors) {
                    if (errors.hasOwnProperty(key)) {
                        if (errMsg !== '') {
                            errMsg += '\n';
                        }
                        errMsg += `${errors[key]}`;
                    }
                }
            } else {
                errMsg = errors.toString();
            }
        } else {
            errMsg = error.message ? error.message : error.toString();
        }

        console.error(errMsg);
        const message: UiMessage = {
            title: 'Raiden Error',
            description: errMsg
        };
        this.notificationService.addErrorNotification(message);
        return throwError(errMsg);
    }
}
