import BigNumber from 'bignumber.js';

export const transferThresholds: { [tokenAddress: string]: BigNumber } = {
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': new BigNumber(10 ** 11),
    '0x6b175474e89094c44da98b954eedeac495271d0f': new BigNumber(10 ** 13)
};
