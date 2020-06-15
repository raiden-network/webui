import { TokenInfo } from '../models/usertoken';
import BigNumber from 'bignumber.js';

export const tokenConstants: { [chainId: number]: TokenInfo[] } = {
    1: [
        {
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            symbol: 'WETH',
            name: 'Wrapped Ether',
            decimals: 18,
            transferThreshold: new BigNumber(10 ** 11),
        },
        {
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            decimals: 18,
            transferThreshold: new BigNumber(10 ** 13),
        },
    ],
};
