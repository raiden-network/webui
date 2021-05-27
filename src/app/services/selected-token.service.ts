import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserToken } from '../models/usertoken';

@Injectable({
    providedIn: 'root',
})
export class SelectedTokenService {
    selectedToken$: Observable<UserToken>;

    private selectedTokenSubject: BehaviorSubject<UserToken> =
        new BehaviorSubject(undefined);

    constructor() {
        this.selectedToken$ = this.selectedTokenSubject.asObservable();
    }

    setToken(token: UserToken) {
        this.selectedTokenSubject.next(token);
    }

    resetToken() {
        this.selectedTokenSubject.next(undefined);
    }
}
