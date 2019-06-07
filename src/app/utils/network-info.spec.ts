import { NetworkInfo } from './network-info';

describe('NetworkInfo', () => {
    describe('getName', function() {
        it('should return Mainnet when chain id is 1', () => {
            expect(NetworkInfo.getNetwork(1)).toEqual({
                name: 'Mainnet',
                shortName: 'eth',
                chainId: 1
            });
        });

        it('should return Ropsten when chain id is 3', () => {
            expect(NetworkInfo.getNetwork(3)).toEqual({
                name: 'Ropsten',
                shortName: 'rop',
                chainId: 3
            });
        });

        it('should return Rinkeby when chain id is 4', () => {
            expect(NetworkInfo.getNetwork(4)).toEqual({
                name: 'Rinkeby',
                shortName: 'rin',
                chainId: 4
            });
        });

        it('should return Görli when chain id is 5', () => {
            expect(NetworkInfo.getNetwork(5)).toEqual({
                name: 'Görli',
                shortName: 'gor',
                chainId: 5
            });
        });

        it('should return Kovan when chain id is 42', () => {
            expect(NetworkInfo.getNetwork(42)).toEqual({
                name: 'Kovan',
                shortName: 'kov',
                chainId: 42
            });
        });

        it('should return the Chain-id: number when the name is not known', () => {
            expect(NetworkInfo.getNetwork(123)).toEqual({
                name: 'Chain-id: 123',
                shortName: 'eth',
                chainId: 123
            });
        });
    });
});
