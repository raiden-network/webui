export class NetworkInfo {
    private static known: Network[] = [
        {
            name: 'Mainnet',
            chainId: 1
        },
        {
            name: 'Ropsten',
            chainId: 3
        },
        {
            name: 'Rinkeby',
            chainId: 4
        },
        {
            name: 'Görli',
            chainId: 5
        },
        {
            name: 'Kovan',
            chainId: 42
        }
    ];

    public static getName(chainId: number): string {
        const matches = NetworkInfo.known.filter(
            value => value.chainId === chainId
        );
        if (matches.length === 0) {
            return `Chain-id: ${chainId}`;
        } else {
            return matches[0].name;
        }
    }
}

export interface Network {
    readonly name: string;
    readonly chainId: number;
}
