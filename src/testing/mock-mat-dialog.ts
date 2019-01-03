import { of } from "rxjs";

export class MockMatDialog {
    cancelled: boolean;

    open() {
        return {
            afterClosed: () => {
                return of(this.cancelled ? null : true)
            }
        }
    }
}