import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EnvironmentType } from './enviroment-type.enum';
import { SharedService } from './shared.service';
// @ts-ignore
import * as Web3 from 'web3';
import { BatchManager } from './batch-manager';

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

                    this.web3 = new Web3(new Web3.providers.HttpProvider(this.config.web3, 2000));
                    // make a simple test call to web3

                    this.web3.eth.net.getId().catch(reason => {
                        console.error(`Invalid web3 endpoint, switching to fallback ${this.config.web3_fallback}`, reason);
                        this.config.web3 = this.config.web3_fallback;
                        this.web3 = new Web3(new Web3.providers.HttpProvider(this.config.web3));
                        this.createBatchManager();
                        reject(reason);
                    }).then(() => {
                        this.web3 = new Web3(new Web3.providers.HttpProvider(this.config.web3));
                        this.createBatchManager();
                        resolve();
                    });

                });
        });
    }

    private createBatchManager() {
        this._batchManager = new BatchManager(this.web3.currentProvider);
    }
}
