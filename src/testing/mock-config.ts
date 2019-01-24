// @ts-ignore
import * as Web3 from 'web3';
import Utils from 'web3/utils';
import { RaidenConfig } from '../app/services/raiden.config';
import { BatchManager } from '../app/services/batch-manager';

class MockWeb3 extends Web3 {
    isChecksum = false;
    checksumAddress = '';

    constructor() {
        super();

        const mockWeb3 = this;
        this.eth.getBlockNumber = function () {
            return Promise.resolve(3694423);
        };

        const mockUtils = {
            checkAddressChecksum: function () {
                return mockWeb3.isChecksum;
            },
            toChecksumAddress: function () {
                return mockWeb3.checksumAddress;
            }
        };

        // @ts-ignore
        this.utils = Object.assign(mockUtils, super.utils);

    }

    utils: Utils;
}

export class MockConfig extends RaidenConfig {
    public web3: Web3 = new MockWeb3();
    private testBatchManager: BatchManager = new BatchManager(this.web3.currentProvider);

    get batchManager(): BatchManager {
        return this.testBatchManager;
    }

    private get mock(): MockWeb3 {
        return (this.web3 as MockWeb3);
    }

    updateChecksumAddress(address: string): void {
        this.mock.checksumAddress = address;
    }

    setIsChecksum(isChecksum: boolean): void {
        this.mock.isChecksum = isChecksum;
    }
}
