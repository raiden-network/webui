import { of } from 'rxjs';

export class MockMatDialog {
    cancelled: boolean;
    openDialogs = [];

    constructor() {}

    returns: () => any = () => true;

    open(component, options) {
        return {
            componentInstance: {},
            afterClosed: () => of(this.cancelled ? null : this.returns()),
            close() {},
        };
    }
}
