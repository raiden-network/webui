export interface Contact {
    readonly address: string;
    readonly label: string;
}

export interface Contacts {
    [address: string]: string;
}
