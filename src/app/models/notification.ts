export interface UiMessage {
    readonly title: string;
    readonly description: string;
}

export interface NotificationMessage extends UiMessage {
    readonly identifier: number;
}
