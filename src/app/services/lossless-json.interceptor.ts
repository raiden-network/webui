import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpResponse,
    HttpErrorResponse,
    HttpResponseBase
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { losslessParse } from '../utils/lossless-json.converter';

const XSSI_PREFIX = /^\)\]\}',?\n/;

@Injectable()
export class LosslessJsonInterceptor implements HttpInterceptor {
    public intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        if (req.responseType !== 'json') {
            return next.handle(req);
        }
        req = req.clone({
            responseType: 'text'
        });

        return next.handle(req).pipe(
            map(event => {
                if (event instanceof HttpResponse) {
                    return this.parseSuccessfulResponse(event);
                }
                return event;
            }),
            catchError(error => {
                throw this.parseErrorResponse(error);
            })
        );
    }

    private parseSuccessfulResponse(
        res: HttpResponse<string>
    ): HttpResponse<any> {
        const body = this.parseJsonResponse(res.body, res);
        return res.clone({ body });
    }

    private parseErrorResponse(errorRes: HttpErrorResponse): HttpErrorResponse {
        if (!errorRes.error) {
            return errorRes;
        }
        const error = this.parseJsonResponse(errorRes.error, errorRes);
        return new HttpErrorResponse({
            error,
            headers: errorRes.headers,
            status: errorRes.status,
            statusText: errorRes.statusText,
            url: errorRes.url || undefined
        });
    }

    private parseJsonResponse(json: string, res: HttpResponseBase): any {
        if (typeof json === 'string') {
            const originalMessage = json;
            json = json.replace(XSSI_PREFIX, '');
            try {
                json = json !== '' ? losslessParse(json) : null;
            } catch (error) {
                throw new HttpErrorResponse({
                    error: { error, text: originalMessage },
                    headers: res.headers,
                    status: res.status,
                    statusText: res.statusText,
                    url: res.url || undefined
                });
            }
        }
        return json;
    }
}
