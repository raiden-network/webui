import { UserToken } from './usertoken';

export interface UiMessage {
    readonly title: string;
    readonly description: string;
    readonly icon: string;
    readonly identiconAddress?: string;
    readonly userToken?: UserToken;
}

export interface NotificationMessage extends UiMessage {
    readonly identifier: number;
    readonly timestamp: string;
}
