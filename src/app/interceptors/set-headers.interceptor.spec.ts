import { TestBed } from '@angular/core/testing';
import { SetHeadersInterceptor } from './set-headers.interceptor';
import { Injectable } from '@angular/core';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    HttpTestingController,
    HttpClientTestingModule,
} from '@angular/common/http/testing';

@Injectable()
class MockRequestingService {
    constructor(private http: HttpClient) {}

    putData(body: any): Observable<any> {
        return this.http.put('someurl.com/data', body);
    }
}

describe('SetHeadersInterceptor', () => {
    let service: MockRequestingService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                MockRequestingService,
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: SetHeadersInterceptor,
                    multi: true,
                },
            ],
        });

        service = TestBed.inject(MockRequestingService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    it('should set Content-Type header to application/json', () => {
        service.putData({ data: '1' }).subscribe();

        httpMock.expectOne(
            (req) => req.headers.get('Content-Type') === 'application/json'
        );
    });
});
