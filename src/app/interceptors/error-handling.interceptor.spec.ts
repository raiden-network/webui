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

@Injectable()
class MockRequestingService {
    constructor(private http: HttpClient) {}

    getData(): Observable<any> {
        return this.http.get('localhost:5001/api');
    }
}

describe('ErrorHandlingInterceptor', () => {
    let service: MockRequestingService;
    let httpMock: HttpTestingController;
    let notificationService: NotificationService;

    beforeEach(() => {
        notificationService = jasmine.createSpyObj('NotificationService', [
            'addErrorNotification',
        ]);
        notificationService.apiError = undefined;

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                MockRequestingService,
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: ErrorHandlingInterceptor,
                    deps: [NotificationService, RaidenService],
                    multi: true,
                },
                TestProviders.MockRaidenConfigProvider(),
                {
                    provide: NotificationService,
                    useValue: notificationService,
                },
                TestProviders.AddressBookStubProvider(),
            ],
        });

        service = TestBed.inject(MockRequestingService);
        httpMock = TestBed.inject(HttpTestingController);
        notificationService = TestBed.inject(NotificationService);
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

        const request = httpMock.expectOne('localhost:5001/api');

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

        const request = httpMock.expectOne('localhost:5001/api');

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
        const errorMessage =
            'Http failure response for localhost:5001/api: 400 ';
        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            (error) => {
                expect(error).toBe(errorMessage);
            }
        );

        const request = httpMock.expectOne('localhost:5001/api');

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

        let request = httpMock.expectOne('localhost:5001/api');

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
        request = httpMock.expectOne('localhost:5001/api');
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

        let request = httpMock.expectOne('localhost:5001/api');

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
        request = httpMock.expectOne('localhost:5001/api');
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
            'refreshAddress'
        ).and.callFake(() => {});

        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            (error) => {
                expect(error).toBeTruthy('An error is expected');
            }
        );

        let request = httpMock.expectOne('localhost:5001/api');

        request.flush(
            {},
            {
                status: 504,
                statusText: '',
            }
        );

        service.getData().subscribe();
        request = httpMock.expectOne('localhost:5001/api');
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
