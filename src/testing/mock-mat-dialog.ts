import { of } from 'rxjs';

export class MockMatDialog {
    cancelled: boolean;
    returns: () => any = () => true;

    constructor() {}

    open() {
        return {
            afterClosed: () => {
                return of(this.cancelled ? null : this.returns());
            }
        };
    }
}
