export interface Address {
    readonly address: string;
    readonly label: string;
}

export interface Addresses {
    [address: string]: string;
}
