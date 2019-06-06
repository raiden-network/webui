import { NetworkInfo } from './network-info';

describe('NetworkInfo', () => {
    describe('getName', function() {
        it('should return Mainnet when chain id is 1', () => {
            expect(NetworkInfo.getName(1)).toEqual('Mainnet');
        });

        it('should return Ropsten when chain id is 3', () => {
            expect(NetworkInfo.getName(3)).toEqual('Ropsten');
        });

        it('should return Rinkeby when chain id is 4', () => {
            expect(NetworkInfo.getName(4)).toEqual('Rinkeby');
        });

        it('should return Görli when chain id is 5', () => {
            expect(NetworkInfo.getName(5)).toEqual('Görli');
        });

        it('should return Kovan when chain id is 42', () => {
            expect(NetworkInfo.getName(42)).toEqual('Kovan');
        });

        it('should return the Chain-id: number when the name is not known', () => {
            expect(NetworkInfo.getName(123)).toEqual('Chain-id: 123');
        });
    });
});
