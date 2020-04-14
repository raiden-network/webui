import Web3 from 'web3';
import { Utils } from 'web3-utils';
import { HttpProvider } from 'web3-providers';
import { RaidenConfig } from '../app/services/raiden.config';
import { BatchManager } from '../app/services/batch-manager';
import { HttpBackend } from '@angular/common/http';
import { stub } from './stub';
import { NotificationService } from '../app/services/notification.service';
import { Network } from '../app/utils/network-info';
import { createNetworkMock } from './test-data';
import { Injectable } from '@angular/core';

class MockWeb3 extends Web3 {
    isChecksum = false;
    checksumAddress = '';

    constructor() {
        super(new HttpProvider('http://localhost:8485'));

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
            },
        };

        // @ts-ignore
        this.utils = Object.assign(mockUtils, super.utils);
    }

    utils: Utils;
}

// noinspection JSUnusedLocalSymbols
const mockProvider = {
    web3: new MockWeb3(),
    create(provider: HttpProvider): Web3 {
        return this.web3;
    },
};

const mockNetwork = createNetworkMock();

@Injectable()
export class MockConfig extends RaidenConfig {
    public web3: Web3 = mockProvider.web3;
    private testBatchManager: BatchManager = new BatchManager(this.web3);

    constructor() {
        super(stub<HttpBackend>(), stub<NotificationService>(), mockProvider);
        // @ts-ignore
        this._network$.next(mockNetwork);
    }

    get batchManager(): BatchManager {
        return this.testBatchManager;
    }

    private get mock(): MockWeb3 {
        return this.web3 as MockWeb3;
    }

    updateChecksumAddress(address: string): void {
        this.mock.checksumAddress = address;
    }

    updateNetwork(network: Network) {
        // @ts-ignore
        this._network$.next(network);
    }

    setIsChecksum(isChecksum: boolean): void {
        this.mock.isChecksum = isChecksum;
    }
}
