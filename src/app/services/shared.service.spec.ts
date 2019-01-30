import { inject, TestBed } from '@angular/core/testing';

import { ConnectivityStatus, SharedService } from './shared.service';

describe('SharedService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [SharedService]
        });
    });

    it('should create', inject([SharedService], (service: SharedService) => {
        expect(service).toBeTruthy();
    }));

    it('should have undefined status by default', inject(
        [SharedService],
        (service: SharedService) => {
            expect(service.status).toBe(ConnectivityStatus.UNDEFINED);
        }
    ));

    it('should have falsy stacktrace', inject(
        [SharedService],
        (service: SharedService) => {
            expect(service.getStackTrace()).toBeFalsy();
        }
    ));
});
