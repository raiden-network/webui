import { HttpClient, HttpBackend } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EnvironmentType } from '../models/enviroment-type.enum';
import { HttpProvider, provider } from 'web3-core';
import Web3 from 'web3';
import { Observable, ReplaySubject } from 'rxjs';
import { Network, NetworkInfo } from '../utils/network-info';
import { NotificationService } from './notification.service';

interface RDNConfig {
    raiden: string;
    web3: string;
    web3_fallback?: string;
    poll_interval?: number;
    error_poll_interval?: number;
    block_start?: number;
    http_timeout?: number;
    settle_timeout?: number;
    reveal_timeout?: number;
    environment_type?: EnvironmentType;
}

const default_config: RDNConfig = {
    raiden: '/api/v1',
    web3: '/web3',
    web3_fallback: 'http://localhost:8545',
    poll_interval: 5000,
    error_poll_interval: 30000,
    block_start: 1603031,
    http_timeout: 600000,
    settle_timeout: 500,
    reveal_timeout: 10,
    environment_type: EnvironmentType.DEVELOPMENT,
};

@Injectable()
export class Web3Factory {
    create(web3Provider: provider): Web3 {
        return new Web3(web3Provider);
    }
}

@Injectable()
export class RaidenConfig {
    public config: RDNConfig = Object.assign({}, default_config);
    public api: string;
    public web3: Web3;

    private http: HttpClient;
    private _network$: ReplaySubject<Network> = new ReplaySubject(1);

    public get network$(): Observable<Network> {
        return this._network$;
    }

    constructor(
        private handler: HttpBackend,
        private notificationService: NotificationService,
        private web3Factory: Web3Factory
    ) {
        this.http = new HttpClient(handler);
    }

    private static isAbsolute(url: string) {
        return url.match(/^[a-zA-Z]+:\/\//);
    }

    async load(url: string): Promise<boolean> {
        await this.loadConfiguration(url);
        try {
            await this.setupWeb3();
            this.notificationService.rpcError = undefined;
            return true;
        } catch (e) {
            console.error(e.message);
            this.notificationService.rpcError = e;
            return false;
        }
    }

    private async setupWeb3(): Promise<void> {
        this.web3 = this.web3Factory.create(this.provider());

        const getNetworkId: () => Promise<number> = () => {
            return new Promise(async (resolve, reject) => {
                const timeout = setTimeout(
                    () =>
                        reject(
                            new Error(
                                'A timeout occurred when trying to connect to the Web3 provider'
                            )
                        ),
                    2000
                );
                try {
                    const id = await this.web3.eth.net.getId();
                    clearTimeout(timeout);
                    resolve(id);
                } catch (e) {
                    reject(e);
                }
            });
        };

        try {
            const id = await getNetworkId();
            this._network$.next(NetworkInfo.getNetwork(id));
        } catch (e) {
            this.config.web3 = this.config.web3_fallback;
            this.web3 = this.web3Factory.create(this.provider());
            const id = await getNetworkId();
            this._network$.next(NetworkInfo.getNetwork(id));
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
    }

    private provider(): HttpProvider {
        let host = this.config.web3;
        if (
            !RaidenConfig.isAbsolute(this.config.web3) &&
            /^\/\w/.test(this.config.web3)
        ) {
            host = `${window.location.origin}${this.config.web3}`;
        }

        return new Web3.providers.HttpProvider(host);
    }
}
