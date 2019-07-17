export class NetworkInfo {
    private static known: Network[] = [
        {
            name: 'Mainnet',
            shortName: 'eth',
            chainId: 1,
            faucet: undefined
        },
        {
            name: 'Ropsten',
            shortName: 'rop',
            chainId: 3,
            faucet: 'https://faucet.ropsten.be/?${ADDRESS}'
        },
        {
            name: 'Rinkeby',
            shortName: 'rin',
            chainId: 4,
            faucet: 'https://faucet.rinkeby.io/'
        },
        {
            name: 'Görli',
            shortName: 'gor',
            chainId: 5,
            faucet: 'https://goerli-faucet.slock.it/?address=${ADDRESS}'
        },
        {
            name: 'Kovan',
            shortName: 'kov',
            chainId: 42,
            faucet: 'https://faucet.kovan.network/'
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
                chainId: chainId,
                faucet: undefined
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
    readonly faucet?: string;
}
