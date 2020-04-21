import { NetworkInfo } from './network-info';

describe('NetworkInfo', () => {
    describe('getName', function () {
        it('should return Mainnet when chain id is 1', () => {
            expect(NetworkInfo.getNetwork(1)).toEqual({
                name: 'Mainnet',
                shortName: 'eth',
                chainId: 1,
                ensSupported: true,
                faucet: undefined,
            });
        });

        it('should return Ropsten when chain id is 3', () => {
            expect(NetworkInfo.getNetwork(3)).toEqual({
                name: 'Ropsten',
                shortName: 'rop',
                chainId: 3,
                ensSupported: true,
                faucet: 'https://faucet.ropsten.be/?${ADDRESS}',
            });
        });

        it('should return Rinkeby when chain id is 4', () => {
            expect(NetworkInfo.getNetwork(4)).toEqual({
                name: 'Rinkeby',
                shortName: 'rin',
                chainId: 4,
                ensSupported: true,
                faucet: 'https://faucet.rinkeby.io/',
            });
        });

        it('should return Görli when chain id is 5', () => {
            expect(NetworkInfo.getNetwork(5)).toEqual({
                name: 'Görli',
                shortName: 'gor',
                chainId: 5,
                ensSupported: true,
                faucet: 'https://goerli-faucet.slock.it/?address=${ADDRESS}',
            });
        });

        it('should return Kovan when chain id is 42', () => {
            expect(NetworkInfo.getNetwork(42)).toEqual({
                name: 'Kovan',
                shortName: 'kov',
                chainId: 42,
                ensSupported: false,
                faucet: 'https://faucet.kovan.network/',
            });
        });

        it('should return the Chain-id: number when the name is not known', () => {
            expect(NetworkInfo.getNetwork(123)).toEqual({
                name: 'Chain-id: 123',
                shortName: 'eth',
                chainId: 123,
                ensSupported: false,
                faucet: undefined,
            });
        });
    });
});
