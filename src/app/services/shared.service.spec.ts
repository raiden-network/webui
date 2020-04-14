import { TestBed } from '@angular/core/testing';
import { SharedService } from './shared.service';

describe('SharedService', () => {
    let service: SharedService;

    beforeEach(() => TestBed.configureTestingModule({}));

    beforeEach(() => {
        service = TestBed.inject(SharedService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should register a new global click with target', () => {
        const element = document.createElement('div');
        service.globalClickTarget$.subscribe((target) => {
            expect(target).toEqual(element);
        });
        service.newGlobalClick(element);
    });

    it('should set a new search filter', () => {
        service.searchFilter$.subscribe((value) => {
            expect(value).toEqual('TestToken');
        });
        service.setSearchValue('TestToken');
    });
});
