import { TestBed } from '@angular/core/testing';
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ErrorHandlingInterceptor } from './error-handling.interceptor';
import { TestProviders } from '../../testing/test-providers';
import { NotificationService } from '../services/notification.service';
import { UiMessage } from '../models/notification';

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
            'addErrorNotification'
        ]);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                MockRequestingService,
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: ErrorHandlingInterceptor,
                    deps: [NotificationService],
                    multi: true
                },
                TestProviders.MockRaidenConfigProvider(),
                {
                    provide: NotificationService,
                    useValue: notificationService
                }
            ]
        });

        service = TestBed.get(MockRequestingService);
        httpMock = TestBed.get(HttpTestingController);
    });

    it('should handle Raiden API errors', () => {
        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            error => {
                expect(error).toBeTruthy('An error is expected');
            }
        );

        const request = httpMock.expectOne('localhost:5001/api');

        const errorMessage = 'An Raiden API error occured.';
        const errorBody = {
            errors: errorMessage
        };

        request.flush(errorBody, {
            status: 400,
            statusText: ''
        });

        const notificationMessage: UiMessage = {
            title: 'Raiden Error',
            description: errorMessage
        };
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
        expect(notificationService.addErrorNotification).toHaveBeenCalledWith(
            notificationMessage
        );
    });

    it('should handle Raiden API errors with multiple messages', () => {
        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            error => {
                expect(error).toBeTruthy('An error is expected');
            }
        );

        const request = httpMock.expectOne('localhost:5001/api');

        const errorBody = {
            errors: ['An Raiden API error occured.', 'Another error occured.']
        };

        request.flush(errorBody, {
            status: 400,
            statusText: ''
        });

        const notificationMessage: UiMessage = {
            title: 'Raiden Error',
            description: 'An Raiden API error occured.\nAnother error occured.'
        };
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
        expect(notificationService.addErrorNotification).toHaveBeenCalledWith(
            notificationMessage
        );
    });

    it('should handle Raiden API errors with no message', () => {
        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            error => {
                expect(error).toBeTruthy('An error is expected');
            }
        );

        const request = httpMock.expectOne('localhost:5001/api');

        const errorBody = {
            errors: ''
        };

        request.flush(errorBody, {
            status: 400,
            statusText: ''
        });

        const notificationMessage: UiMessage = {
            title: 'Raiden Error',
            description: 'Http failure response for localhost:5001/api: 400 '
        };
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
        expect(notificationService.addErrorNotification).toHaveBeenCalledWith(
            notificationMessage
        );
    });

    it('should handle non-response Raiden API errors', () => {
        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            error => {
                expect(error).toBeTruthy('An error is expected');
            }
        );

        let request = httpMock.expectOne('localhost:5001/api');

        request.flush(
            {},
            {
                status: 504,
                statusText: ''
            }
        );

        const notificationMessage: UiMessage = {
            title: 'API not available',
            description: 'Could not connect to the Raiden API'
        };
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
        expect(notificationService.addErrorNotification).toHaveBeenCalledWith(
            notificationMessage
        );

        service.getData().subscribe(
            () => {
                fail('On next should not be called');
            },
            error => {
                expect(error).toBeTruthy('An error is expected');
            }
        );
        request = httpMock.expectOne('localhost:5001/api');
        request.flush(
            {},
            {
                status: 0,
                statusText: ''
            }
        );

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
    });
});
