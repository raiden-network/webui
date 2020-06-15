import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpErrorResponse,
    HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { UiMessage } from '../models/notification';
import { RaidenService } from '../services/raiden.service';

@Injectable()
export class ErrorHandlingInterceptor implements HttpInterceptor {
    constructor(
        private notificationService: NotificationService,
        private raidenService: RaidenService
    ) {}

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            tap((event) => {
                if (
                    event instanceof HttpResponse &&
                    event.url.includes('/api') &&
                    this.notificationService.apiError
                ) {
                    this.raidenService.attemptRpcConnection();
                    this.raidenService.reconnectSuccessful();
                    this.notificationService.apiError = undefined;
                }
            }),
            catchError((error) => this.handleError(error))
        );
    }

    private handleError(error: HttpErrorResponse | Error) {
        let errMsg: string;

        if (
            error instanceof HttpErrorResponse &&
            (error.status === 504 || error.status === 0)
        ) {
            errMsg = 'Could not connect to the Raiden API';
            if (
                !this.notificationService.apiError ||
                this.notificationService.apiError.retrying
            ) {
                this.notificationService.apiError = error;
                console.error(`${errMsg}: ${error.message}`);
                const notificationMessage: UiMessage = {
                    title: 'API',
                    description: 'connection failure',
                    icon: 'error-mark',
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
        return throwError(errMsg);
    }
}
