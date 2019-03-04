import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EnvironmentType } from './enviroment-type.enum';
import { BatchManager } from './batch-manager';
import { SharedService } from './shared.service';
import { HttpProvider } from 'web3-providers/types';
import Web3 from 'web3';

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

export class Web3Factory {
    // noinspection JSMethodCanBeStatic
    create(provider: HttpProvider): Web3 {
        return new Web3(provider);
    }
}

@Injectable()
export class RaidenConfig {
    public config: RDNConfig = Object.assign({}, default_config);
    public api: string;
    public web3: Web3;

    constructor(
        private http: HttpClient,
        private sharedService: SharedService,
        private web3Factory: Web3Factory
    ) {}

    private _batchManager: BatchManager;

    public get batchManager(): BatchManager {
        return this._batchManager;
    }

    private static isAbsolute(url: string) {
        return url.match(/^[a-zA-Z]+:\/\//);
    }

    async load(url: string): Promise<boolean> {
        await this.loadConfiguration(url);
        try {
            await this.setupWeb3();
            return true;
        } catch (e) {
            this.sharedService.displayableError = e;
            return false;
        }
    }

    private async setupWeb3(): Promise<void> {
        const provider = this.provider(2000);
        this.web3 = this.web3Factory.create(provider);

        try {
            await this.web3.eth.net.getId();
            this.web3 = this.web3Factory.create(this.provider());
            this.createBatchManager();
        } catch (e) {
            this.config.web3 = this.config.web3_fallback;
            this.web3 = this.web3Factory.create(this.provider());
            this.createBatchManager();
            await this.web3.eth.net.getId();
        }
    }

    private async loadConfiguration(url: string) {
        let rdnConfig: RDNConfig;
        try {
            rdnConfig = await this.http.get<RDNConfig>(url).toPromise();
        } catch (e) {
            rdnConfig = Object.assign({}, default_config);
        }

        this.config = Object.assign({}, default_config, rdnConfig);
        this.api = this.config.raiden;
        this.sharedService.httpTimeout = this.config.http_timeout;
    }

    private provider(timeout?: number): HttpProvider {
        let host = this.config.web3;
        if (
            !RaidenConfig.isAbsolute(this.config.web3) &&
            /^\/\w/.test(this.config.web3)
        ) {
            host = `${window.location.origin}${this.config.web3}`;
        }

        return new Web3.providers.HttpProvider(host, { timeout });
    }

    private createBatchManager() {
        this._batchManager = new BatchManager(this.web3);
    }
}
