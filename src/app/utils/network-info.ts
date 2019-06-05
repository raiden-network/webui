export class NetworkInfo {
    private static known: Network[] = [
        {
            name: 'mainnet',
            chainId: 1
        },
        {
            name: 'ropsten',
            chainId: 3
        },
        {
            name: 'rinkeby',
            chainId: 4
        },
        {
            name: 'görli',
            chainId: 5
        },
        {
            name: 'kovan',
            chainId: 42
        }
    ];

    public static getName(chainId: number): string {
        const matches = NetworkInfo.known.filter(
            value => value.chainId === chainId
        );
        if (matches.length === 0) {
            return chainId.toString();
        } else {
            return matches[0].name;
        }
    }
}

export interface Network {
    readonly name: string;
    readonly chainId: number;
}
