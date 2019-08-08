import { TestBed } from '@angular/core/testing';
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LosslessJsonInterceptor } from './lossless-json.interceptor';
import BigNumber from 'bignumber.js';

@Injectable()
class MockRequestingService {
    constructor(private http: HttpClient) {}

    getJsonData(): Observable<any> {
        return this.http.get('someurl.com/data');
    }

    getTextData(): Observable<any> {
        return this.http.get('someurl.com/data', { responseType: 'text' });
    }
}

describe(`LosslessJsonInterceptor`, () => {
    let service: MockRequestingService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                MockRequestingService,
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: LosslessJsonInterceptor,
                    multi: true
                }
            ]
        });

        service = TestBed.get(MockRequestingService);
        httpMock = TestBed.get(HttpTestingController);
    });

    it('should convert JSON response losslessly', () => {
        service.getJsonData().subscribe(response => {
            expect(response).toEqual({
                big: new BigNumber('18446744073709551616'),
                text: 'Hello'
            });
        });

        const request = httpMock.expectOne('someurl.com/data');
        request.flush('{"big":18446744073709551616,"text":"Hello"}', {
            status: 200,
            statusText: ''
        });
    });

    it('should do nothing for non JSON responses', () => {
        service.getTextData().subscribe(response => {
            expect(response).toBe('Hello');
        });

        const request = httpMock.expectOne('someurl.com/data');
        request.flush('Hello', { status: 200, statusText: '' });
    });

    it('should throw an error if response cannot be parsed', () => {
        service.getJsonData().subscribe(
            () => {
                fail('On next should not be called');
            },
            error => {
                expect(error).toBeTruthy('An error is expected');
            }
        );

        const request = httpMock.expectOne('someurl.com/data');
        request.flush('Hello', { status: 200, statusText: '' });
    });

    it('should convert JSON error response', () => {
        service.getJsonData().subscribe(
            () => {
                fail('On next should not be called');
            },
            error => {
                expect(error.error.errors).toEqual('An error occured.');
            }
        );

        const request = httpMock.expectOne('someurl.com/data');
        request.flush(
            { errors: 'An error occured.' },
            {
                status: 400,
                statusText: ''
            }
        );
    });
});
