import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UtilityService {
    private globalClickTargetSubject: Subject<HTMLElement> = new Subject();

    readonly globalClickTarget$: Observable<
        HTMLElement
    > = this.globalClickTargetSubject.asObservable();

    constructor() {}

    newGlobalClick(target: HTMLElement) {
        this.globalClickTargetSubject.next(target);
    }
}
