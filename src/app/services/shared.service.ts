import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class SharedService {
    readonly globalClickTarget$: Observable<HTMLElement>;
    readonly searchFilter$: Observable<string>;

    private globalClickTargetSubject: Subject<HTMLElement> = new Subject();
    private searchFilterSubject: BehaviorSubject<string> = new BehaviorSubject(
        ''
    );

    constructor() {
        this.globalClickTarget$ = this.globalClickTargetSubject.asObservable();

        this.searchFilter$ = this.searchFilterSubject
            .asObservable()
            .pipe(debounceTime(400), distinctUntilChanged());
    }

    newGlobalClick(target: HTMLElement) {
        this.globalClickTargetSubject.next(target);
    }

    setSearchValue(value: string) {
        this.searchFilterSubject.next(value);
    }
}
