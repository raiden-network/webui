import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EnvironmentType } from './enviroment-type.enum';
import { SharedService } from './shared.service';
// @ts-ignore
import * as Web3 from 'web3';
import { BatchManager } from './batch-manager';
import { HttpProvider, Provider } from 'web3/providers';

interface RDNConfig {
    raiden: string;
    web3: string;
    web3_fallback?: string;
    poll_interval?: number;
    block_start?: number;
    http_timeout?: number;
    settle_timeout?: number;
    reveal_timeout?: number;
    environment_type?: EnvironmentType;
}

const default_config: RDNConfig = {
    raiden: '/api/1',
    web3: '/web3',
    web3_fallback: 'http://localhost:8545',
    poll_interval: 5000,
    block_start: 1603031,
    http_timeout: 600000,
    settle_timeout: 500,
    reveal_timeout: 10,
    environment_type: EnvironmentType.DEVELOPMENT
};

function override(object, methodName, callback) {
    object[methodName] = callback(object[methodName]);
}

@Injectable()
export class RaidenConfig {
    public config: RDNConfig = default_config;
    public api: string;
    public web3: Web3;

    constructor(
        private http: HttpClient,
        private sharedService: SharedService
    ) {
    }

    private _batchManager: BatchManager;

    public get batchManager(): BatchManager {
        return this._batchManager;
    }

    load(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.http.get<RDNConfig>(url)
                .subscribe((config) => {
                    this.config = Object.assign({}, default_config, config);
                    this.api = this.config.raiden;
                    this.sharedService.httpTimeout = this.config.http_timeout;

                    this.web3 = new Web3(this.provider(2000));
                    // make a simple test call to web3

                    this.web3.eth.net.getId().catch(reason => {
                        console.error(`Invalid web3 endpoint, switching to fallback ${this.config.web3_fallback}`, reason);
                        this.config.web3 = this.config.web3_fallback;
                        this.web3 = new Web3(this.provider());
                        this.createBatchManager();
                        reject(reason);
                    }).then(() => {
                        this.web3 = new Web3(this.provider());
                        this.createBatchManager();
                        resolve();
                    });
                });
        });
    }

    private provider(timeout?: number): Provider {
        return this.monkeyPatchProvider(new Web3.providers.HttpProvider(this.config.web3, timeout));
    }

    private createBatchManager() {
        this._batchManager = new BatchManager(this.web3.currentProvider);
    }

    // TODO: Workaround for https://github.com/ethereum/web3.js/issues/1803 it should be immediately removed
    // as soon as the issue is fixed upstream.
    // Issue is also documented here https://github.com/ethereum/web3.js/issues/1802
    private monkeyPatchProvider(httpProvider: HttpProvider) {
        override(httpProvider, '_prepareRequest', function () {
            return function () {
                const request = new XMLHttpRequest();

                request.open('POST', this.host, true);
                request.setRequestHeader('Content-Type', 'application/json');
                request.timeout = this.timeout && this.timeout !== 1 ? this.timeout : 0;

                if (this.headers) {
                    this.headers.forEach(function (header) {
                        request.setRequestHeader(header.name, header.value);
                    });
                }

                return request;
            };
        });

        return httpProvider;
    }
}
