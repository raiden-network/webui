import { UserToken } from '../models/usertoken';
import BigNumber from 'bignumber.js';
import { TokenUtils } from './token.utils';

describe('TokenUtils', () => {
    const connectedToken: UserToken = {
        address: '0xeB7f4BBAa1714F3E5a12fF8B681908D7b98BD195',
        symbol: 'ATT',
        name: 'Another Test Token',
        decimals: 0,
        balance: new BigNumber(100),
        sumChannelBalances: new BigNumber(100),
        connected: {
            sum_deposits: new BigNumber(100),
            channels: 1,
        },
    };

    const connectedToken2: UserToken = {
        address: '0x1888f6aF921f350eD71e6e86381Aae1A537A3fDF',
        symbol: 'ATT2',
        name: 'Another Test Token2',
        decimals: 0,
        balance: new BigNumber(50),
        sumChannelBalances: new BigNumber(30),
        connected: {
            sum_deposits: new BigNumber(20),
            channels: 2,
        },
    };

    const unconnectedToken: UserToken = {
        address: '0xB9eF346D094864794a0666D6E84D7Ebd640B4EC5',
        symbol: 'ATT3',
        name: 'Another Test Token3',
        decimals: 0,
        balance: new BigNumber(0),
    };

    const unconnectedToken2: UserToken = {
        address: '0xB9eF346D094864794a0666D6E84D7Ebd640B4EC5',
        symbol: 'ATT4',
        name: 'Another Test Token4',
        decimals: 0,
        balance: new BigNumber(50),
    };

    it('should give connected token a lower index', () => {
        expect(
            TokenUtils.compareTokens(connectedToken, unconnectedToken, 0, 0)
        ).toEqual(-1);
    });

    it('should give unconnected token a higher index', () => {
        expect(
            TokenUtils.compareTokens(unconnectedToken, connectedToken, 0, 0)
        ).toEqual(1);
    });

    it('should compare not connected tokens depending on balance', () => {
        expect(
            TokenUtils.compareTokens(unconnectedToken, unconnectedToken2, 0, 0)
        ).toEqual(50);
    });

    it('should compare connected tokens depending on sum channel balances', () => {
        expect(
            TokenUtils.compareTokens(connectedToken, connectedToken2, 0, 0)
        ).toEqual(-70);
    });

    it('should compare tokens based on usage', () => {
        expect(
            TokenUtils.compareTokens(connectedToken, connectedToken2, 4, 1)
        ).toEqual(-3);
    });
});
