import { tokenConstants } from './token-constants';
import { TokenInfo } from '../models/usertoken';

export class NetworkInfo {
    private static known: Network[] = [
        {
            name: 'Mainnet',
            shortName: 'eth',
            chainId: 1,
            ensSupported: true,
            explorerUrl: 'https://explorer.raiden.network',
            faucet: undefined,
            tokenConstants: tokenConstants[1],
        },
        {
            name: 'Ropsten',
            shortName: 'rop',
            chainId: 3,
            ensSupported: true,
            explorerUrl: 'https://ropsten.explorer.raiden.network',
            faucet: 'https://faucet.ropsten.be/?${ADDRESS}',
        },
        {
            name: 'Rinkeby',
            shortName: 'rin',
            chainId: 4,
            ensSupported: true,
            explorerUrl: 'https://rinkeby.explorer.raiden.network',
            faucet: 'https://faucet.rinkeby.io/',
        },
        {
            name: 'Görli',
            shortName: 'gor',
            chainId: 5,
            ensSupported: true,
            explorerUrl: 'https://goerli.explorer.raiden.network',
            faucet: 'https://goerli-faucet.slock.it/?address=${ADDRESS}',
        },
        {
            name: 'Kovan',
            shortName: 'kov',
            chainId: 42,
            ensSupported: false,
            faucet: 'https://faucet.kovan.network/',
        },
    ];

    public static getNetwork(chainId: number): Network {
        const matches = NetworkInfo.known.filter(
            (value) => value.chainId === chainId
        );
        if (matches.length === 0) {
            return {
                name: `Chain-id: ${chainId}`,
                shortName: 'eth',
                chainId: chainId,
                ensSupported: false,
                faucet: undefined,
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
    readonly ensSupported: boolean;
    readonly explorerUrl?: string;
    readonly faucet?: string;
    readonly tokenConstants?: TokenInfo[];
}
