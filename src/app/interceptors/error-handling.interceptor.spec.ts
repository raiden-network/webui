import { TestBed } from '@angular/core/testing';
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
}

describe('ErrorHandlingInterceptor', () => {
    let service: MockRequestingService;
    let httpMock: HttpTestingController;
    let notificationService: NotificationService;
    let raidenConfig: RaidenConfig;

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

    it('should handle Raiden API errors', () => {
        const errorMessage = 'An Raiden API error occured.';
        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            (error) => {
                expect(error).toBe(errorMessage);
            }
        );

        const request = httpMock.expectOne(raidenConfig.api);

        const errorBody = {
            errors: errorMessage,
        };

        request.flush(errorBody, {
            status: 400,
            statusText: '',
        });
    });

    it('should handle Raiden API errors with multiple messages', () => {
        const errorMessage =
            'An Raiden API error occurred.\nAnother error occurred.';
        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            (error) => {
                expect(error).toBe(errorMessage);
            }
        );

        const request = httpMock.expectOne(raidenConfig.api);

        const errorBody = {
            errors: [
                'An Raiden API error occurred.',
                'Another error occurred.',
            ],
        };

        request.flush(errorBody, {
            status: 400,
            statusText: '',
        });
    });

    it('should handle Raiden API errors with no message', () => {
        const errorMessage = `Http failure response for ${raidenConfig.api}: 400 `;
        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            (error) => {
                expect(error).toBe(errorMessage);
            }
        );

        const request = httpMock.expectOne(raidenConfig.api);

        const errorBody = {
            errors: '',
        };

        request.flush(errorBody, {
            status: 400,
            statusText: '',
        });
    });

    it('should handle non-response Raiden API errors', () => {
        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            (error) => {
                expect(error).toBeTruthy('An error is expected');
            }
        );

        let request = httpMock.expectOne(raidenConfig.api);

        request.flush(
            {},
            {
                status: 504,
                statusText: '',
            }
        );

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );

        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            (error) => {
                expect(error).toBeTruthy('An error is expected');
            }
        );
        request = httpMock.expectOne(raidenConfig.api);
        request.flush(
            {},
            {
                status: 0,
                statusText: '',
            }
        );

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
    });

    it('should always show a notification when the user retries to connect', () => {
        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            (error) => {
                expect(error).toBeTruthy('An error is expected');
            }
        );

        let request = httpMock.expectOne(raidenConfig.api);

        request.flush(
            {},
            {
                status: 504,
                statusText: '',
            }
        );

        notificationService.apiError.retrying = true;
        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            (error) => {
                expect(error).toBeTruthy('An error is expected');
            }
        );
        request = httpMock.expectOne(raidenConfig.api);
        request.flush(
            {},
            {
                status: 504,
                statusText: '',
            }
        );

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            2
        );
    });

    it('should reset the error and refresh rpc connection when connection is back', () => {
        const raidenService = TestBed.inject(RaidenService);
        const attemptSpy = spyOn(raidenService, 'attemptRpcConnection');
        const refreshSpy = spyOn(
            raidenService,
            'reconnectSuccessful'
        ).and.callFake(() => {});

        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            (error) => {
                expect(error).toBeTruthy('An error is expected');
            }
        );

        let request = httpMock.expectOne(raidenConfig.api);

        request.flush(
            {},
            {
                status: 504,
                statusText: '',
            }
        );

        service.getData().subscribe();
        request = httpMock.expectOne(raidenConfig.api);
        request.flush(
            {},
            {
                status: 200,
                statusText: '',
            }
        );

        expect(attemptSpy).toHaveBeenCalledTimes(1);
        expect(refreshSpy).toHaveBeenCalledTimes(1);
        expect(notificationService.apiError).toBeFalsy();
    });
});
