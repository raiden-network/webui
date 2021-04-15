import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import {
    HttpClientTestingModule,
    HttpTestingController,
} from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ErrorHandlingInterceptor } from './error-handling.interceptor';
import { TestProviders } from '../../testing/test-providers';
import { NotificationService } from '../services/notification.service';
import { RaidenService } from '../services/raiden.service';
import { RaidenConfig } from 'app/services/raiden.config';

@Injectable()
class MockRequestingService {
    constructor(private http: HttpClient, private raidenConfig: RaidenConfig) {}

    getData(): Observable<any> {
        return this.http.get(this.raidenConfig.api);
    }

    makeRequest(url: string): Observable<any> {
        return this.http.get(url);
    }
}

describe('ErrorHandlingInterceptor', () => {
    let service: MockRequestingService;
    let httpMock: HttpTestingController;
    let notificationService: NotificationService;
    let raidenConfig: RaidenConfig;

    const httpResponse400 = {
        status: 400,
        statusText: '',
    };
    const httpResponse504 = {
        status: 504,
        statusText: '',
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                MockRequestingService,
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: ErrorHandlingInterceptor,
                    deps: [NotificationService, RaidenService, RaidenConfig],
                    multi: true,
                },
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.SpyNotificationServiceProvider(),
                TestProviders.AddressBookStubProvider(),
            ],
        });

        service = TestBed.inject(MockRequestingService);
        httpMock = TestBed.inject(HttpTestingController);
        notificationService = TestBed.inject(NotificationService);
        raidenConfig = TestBed.inject(RaidenConfig);
    });

    it('should handle Raiden API errors', fakeAsync(() => {
        const errorSpy = jasmine.createSpy();
        const errorMessage = 'An Raiden API error occured.';
        service.getData().subscribe(() => {
            fail('On next should not be called');
        }, errorSpy);

        const request = httpMock.expectOne(raidenConfig.api);

        const errorBody = {
            errors: errorMessage,
        };

        request.flush(errorBody, httpResponse400);
        tick();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(errorMessage);
    }));

    it('should handle Raiden API errors with multiple messages', fakeAsync(() => {
        const errorSpy = jasmine.createSpy();
        const errorMessage =
            'An Raiden API error occurred.\nAnother error occurred.';
        service.getData().subscribe(() => {
            fail('On next should not be called');
        }, errorSpy);

        const request = httpMock.expectOne(raidenConfig.api);

        const errorBody = {
            errors: [
                'An Raiden API error occurred.',
                'Another error occurred.',
            ],
        };

        request.flush(errorBody, httpResponse400);
        tick();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(errorMessage);
    }));

    it('should handle Raiden API errors with no message', fakeAsync(() => {
        const errorSpy = jasmine.createSpy();
        const errorMessage = `Http failure response for ${raidenConfig.api}: 400 `;
        service.getData().subscribe(() => {
            fail('On next should not be called');
        }, errorSpy);

        const request = httpMock.expectOne(raidenConfig.api);

        const errorBody = {
            errors: '',
        };

        request.flush(errorBody, httpResponse400);
        tick();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(errorMessage);
    }));

    it('should handle non-response Raiden API errors', fakeAsync(() => {
        const errorSpy = jasmine.createSpy();
        service.getData().subscribe(() => {
            fail('On next should not be called');
        }, errorSpy);

        let request = httpMock.expectOne(raidenConfig.api);

        request.flush({}, httpResponse504);
        tick();

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
        expect(notificationService.apiError).toBeTruthy();
        expect(errorSpy).toHaveBeenCalledTimes(1);

        service.getData().subscribe(() => {
            fail('On next should not be called');
        }, errorSpy);
        request = httpMock.expectOne(raidenConfig.api);
        request.flush(
            {},
            {
                status: 0,
                statusText: '',
            }
        );
        tick();

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
        expect(notificationService.apiError).toBeTruthy();
        expect(errorSpy).toHaveBeenCalledTimes(2);
    }));

    it('should always show a notification when the user retries to connect', fakeAsync(() => {
        const errorSpy = jasmine.createSpy();
        service.getData().subscribe(() => {
            fail('On next should not be called');
        }, errorSpy);

        let request = httpMock.expectOne(raidenConfig.api);

        request.flush({}, httpResponse504);
        tick();

        notificationService.apiError.retrying = true;
        service.getData().subscribe(() => {
            fail('On next should not be called');
        }, errorSpy);
        request = httpMock.expectOne(raidenConfig.api);
        request.flush({}, httpResponse504);
        tick();

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            2
        );
        expect(notificationService.apiError).toBeTruthy();
        expect(errorSpy).toHaveBeenCalledTimes(2);
    }));

    it('should reset the error and refresh rpc connection when connection is back', fakeAsync(() => {
        const errorSpy = jasmine.createSpy();
        const raidenService = TestBed.inject(RaidenService);
        const attemptSpy = spyOn(raidenService, 'attemptRpcConnection');
        const refreshSpy = spyOn(
            raidenService,
            'reconnectSuccessful'
        ).and.callFake(() => {});

        service.getData().subscribe(() => {
            fail('On next should not be called');
        }, errorSpy);

        let request = httpMock.expectOne(raidenConfig.api);

        request.flush({}, httpResponse504);
        tick();

        service.getData().subscribe((data) => {
            expect(data).toEqual({});
        }, errorSpy);
        request = httpMock.expectOne(raidenConfig.api);
        request.flush(
            {},
            {
                status: 200,
                statusText: '',
            }
        );
        tick();

        expect(attemptSpy).toHaveBeenCalledTimes(1);
        expect(refreshSpy).toHaveBeenCalledTimes(1);
        expect(notificationService.apiError).toBeFalsy();
        expect(errorSpy).toHaveBeenCalledTimes(1);
    }));

    it('should handle non-response Raiden API errors for path url requests', fakeAsync(() => {
        raidenConfig.api = '/api/v1';
        // Unlike the HttpClientModule, the HttpClientTestingModule does not prepend the url
        // property of a HttpResponse with the host if the request was made by a URL path.
        const requestUrl = window.location.origin + raidenConfig.api;
        const errorSpy = jasmine.createSpy();

        service.makeRequest(requestUrl).subscribe(() => {
            fail('On next should not be called');
        }, errorSpy);

        const request = httpMock.expectOne(requestUrl);
        request.flush({}, httpResponse504);
        tick();

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
        expect(notificationService.apiError).toBeTruthy();
        expect(errorSpy).toHaveBeenCalledTimes(1);
    }));

    it('should not misinterpret non-api errors', fakeAsync(() => {
        raidenConfig.api = '/api/v1';
        const requestUrl = 'http://some.url/api/v1';
        const errorSpy = jasmine.createSpy();

        service.makeRequest(requestUrl).subscribe(() => {
            fail('On next should not be called');
        }, errorSpy);

        const request = httpMock.expectOne(requestUrl);
        request.flush({}, httpResponse504);
        tick();

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            0
        );
        expect(notificationService.apiError).toBeFalsy();
        expect(errorSpy).toHaveBeenCalledTimes(1);
    }));
});
