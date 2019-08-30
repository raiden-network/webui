import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { timeout } from 'rxjs/operators';

import { RaidenConfig } from './raiden.config';

@Injectable()
export class TimeoutInterceptor implements HttpInterceptor {
    constructor(private raidenConfig: RaidenConfig) {}

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        let obs = next.handle(req);
        if (this.raidenConfig.config.http_timeout) {
            obs = obs.pipe(timeout(this.raidenConfig.config.http_timeout));
        }
        return obs;
    }
}
