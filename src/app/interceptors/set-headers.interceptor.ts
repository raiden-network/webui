import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class SetHeadersInterceptor implements HttpInterceptor {
    constructor() {}

    intercept(
        request: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        request = request.clone({
            headers: request.headers.set('Content-Type', 'application/json'),
        });
        return next.handle(request);
    }
}
