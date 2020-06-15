import { Injectable } from '@angular/core';
@Injectable()
export class LocalStorageAdapter {
    get localStorage(): Storage {
        return localStorage;
    }
}
