import { inject, TestBed } from '@angular/core/testing';

import { SharedService } from './shared.service';

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
            expect(service.getStackTrace()).toBe(null);
        }
    ));
});
