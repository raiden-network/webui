import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SharedService {
    private globalClickTargetSubject: Subject<HTMLElement> = new Subject();
    private searchFilterSubject: BehaviorSubject<string> = new BehaviorSubject(
        ''
    );

    readonly globalClickTarget$: Observable<
        HTMLElement
    > = this.globalClickTargetSubject.asObservable();
    readonly searchFilter$: Observable<string>;

    constructor() {
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
