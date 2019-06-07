export class NetworkInfo {
    private static known: Network[] = [
        {
            name: 'Mainnet',
            shortName: 'eth',
            chainId: 1
        },
        {
            name: 'Ropsten',
            shortName: 'rop',
            chainId: 3
        },
        {
            name: 'Rinkeby',
            shortName: 'rin',
            chainId: 4
        },
        {
            name: 'Görli',
            shortName: 'gor',
            chainId: 5
        },
        {
            name: 'Kovan',
            shortName: 'kov',
            chainId: 42
        }
    ];

    public static getNetwork(chainId: number): Network {
        const matches = NetworkInfo.known.filter(
            value => value.chainId === chainId
        );
        if (matches.length === 0) {
            return {
                name: `Chain-id: ${chainId}`,
                shortName: 'eth',
                chainId: chainId
            };
        } else {
            return matches[0];
        }
    }
}

export interface Network {
    readonly name: string;
    readonly shortName: string;
    readonly chainId: number;
}
