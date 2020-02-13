import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserToken } from '../models/usertoken';

@Injectable({
    providedIn: 'root'
})
export class SelectedTokenService {
    private selectedTokenSubject: BehaviorSubject<
        UserToken
    > = new BehaviorSubject(undefined);

    selectedToken$: Observable<
        UserToken
    > = this.selectedTokenSubject.asObservable();

    constructor() {}

    setToken(token: UserToken) {
        this.selectedTokenSubject.next(token);
    }
}
