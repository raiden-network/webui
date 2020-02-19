import { of } from 'rxjs';

export class MockMatDialog {
    cancelled: boolean;
    openDialogs = [];
    returns: () => any = () => true;

    constructor() {}

    open(component, options) {
        return {
            componentInstance: {},
            afterClosed: () => {
                return of(this.cancelled ? null : this.returns());
            },
            close() {}
        };
    }
}
