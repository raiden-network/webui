import { TestBed } from '@angular/core/testing';

import { UtilityService } from './utility.service';

describe('UtilityService', () => {
    let service: UtilityService;

    beforeEach(() => TestBed.configureTestingModule({}));

    beforeEach(() => {
        service = TestBed.get(UtilityService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should register a new global click with target', () => {
        const element = document.createElement('div');
        service.globalClickTarget$.subscribe(target => {
            expect(target).toEqual(element);
        });
        service.newGlobalClick(element);
    });
});
