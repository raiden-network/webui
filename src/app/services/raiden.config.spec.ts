import { fakeAsync, flush, inject, TestBed, tick } from '@angular/core/testing';
import { RaidenConfig, Web3Factory } from './raiden.config';
import { HttpClientModule } from '@angular/common/http';
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';
import { SharedService } from './shared.service';
import { EnvironmentType } from './enviroment-type.enum';
// @ts-ignore
import * as Web3 from 'web3';
import { Provider } from 'web3/providers';

class TestWeb3Factory implements Web3Factory {
    private _calls = 0;
    private _failed = [];

    create(provider: Provider): Web3 {
        this._calls++;
        const web3 = new Web3(provider);
        const real = web3.eth.net.getId;
        const reset = () => (web3.eth.net.getId = real);

        const factory = this;
        web3.eth.net.getId = async function() {
            reset();
            const failed = factory._failed;
            const current = factory._calls;
            if (failed.findIndex(value => value === current) >= 0) {
                throw new Error('failed');
            }
            return 1;
        };
        return web3;
    }

    calls() {
        return this._calls;
    }

    addFailedChainIdCall(call: number) {
        this._failed.push(call);
    }
}

describe('RaidenConfig', () => {
    let testingController: HttpTestingController;
    let raidenConfig: RaidenConfig;
    let factory: TestWeb3Factory;
    let sharedService: SharedService;

    const url = 'http://localhost:5001/assets/config/config.production.json';

    const configuration = {
        raiden: 'http://localhost:5001/api/v1',
        reveal_timeout: 20,
        settle_timeout: 600,
        web3: 'http://localhost:8485',
        environment_type: 'production'
    };

    beforeEach(() => {
        factory = new TestWeb3Factory();

        TestBed.configureTestingModule({
            imports: [HttpClientModule, HttpClientTestingModule],
            providers: [
                RaidenConfig,
                SharedService,
                {
                    provide: Web3Factory,
                    useValue: factory
                }
            ]
        });

        testingController = TestBed.get(HttpTestingController);
        raidenConfig = TestBed.get(RaidenConfig);

        sharedService = TestBed.get(SharedService);
    });

    it('should be created', inject([RaidenConfig], (service: RaidenConfig) => {
        expect(service).toBeTruthy();
    }));

    it('should use the default configuration if loading fails', fakeAsync(function() {
        raidenConfig
            .load(url)
            .then(value => {
                expect(value).toBe(true);
            })
            .catch(e => {
                console.error(e);
                fail('it should not fail');
            });

        testingController
            .expectOne({
                url: url,
                method: 'GET'
            })
            .flush(
                {},
                {
                    status: 404,
                    statusText: ''
                }
            );

        tick();

        expect(raidenConfig.config).toEqual({
            raiden: '/api/1',
            web3: '/web3',
            web3_fallback: 'http://localhost:8545',
            poll_interval: 5000,
            block_start: 1603031,
            http_timeout: 600000,
            settle_timeout: 500,
            reveal_timeout: 10,
            environment_type: EnvironmentType.DEVELOPMENT
        });

        expect(sharedService.getStackTrace()).toBe(null);
        expect(factory.calls()).toBe(2);
        flush();
    }));

    it('should merge the loaded configuration with the defaults', fakeAsync(function() {
        raidenConfig
            .load(url)
            .then(value => {
                expect(value).toBe(true);
            })
            .catch(e => {
                console.error(e);
                fail('it should not fail');
            });

        testingController
            .expectOne({
                url: url,
                method: 'GET'
            })
            .flush(configuration, {
                status: 200,
                statusText: ''
            });

        tick();

        expect(raidenConfig.config).toEqual({
            raiden: 'http://localhost:5001/api/v1',
            web3: 'http://localhost:8485',
            web3_fallback: 'http://localhost:8545',
            poll_interval: 5000,
            block_start: 1603031,
            http_timeout: 600000,
            settle_timeout: 600,
            reveal_timeout: 20,
            environment_type: EnvironmentType.PRODUCTION
        });

        expect(sharedService.getStackTrace()).toBe(null);
        expect(factory.calls()).toBe(2);
    }));

    it('should fallback if the primary web3 endpoint fails', fakeAsync(function() {
        factory.addFailedChainIdCall(1);
        raidenConfig
            .load(url)
            .then(value => {
                expect(value).toBe(true);
            })
            .catch(e => {
                console.error(e);
                fail('it should not fail');
            });

        testingController
            .expectOne({
                url: url,
                method: 'GET'
            })
            .flush(configuration, {
                status: 200,
                statusText: ''
            });

        tick();

        expect(sharedService.getStackTrace()).toBe(null);
        expect(factory.calls()).toBe(2);
        expect(raidenConfig.config.web3).toBe(
            raidenConfig.config.web3_fallback
        );
    }));

    it('should return false and set error on the promise if both web3 endpoints fail', fakeAsync(function() {
        factory.addFailedChainIdCall(1);
        factory.addFailedChainIdCall(2);
        raidenConfig
            .load(url)
            .then(value => {
                expect(value).toBe(false);
            })
            .catch(e => {
                console.error(e);
                fail('it should not fail');
            });

        testingController
            .expectOne({
                url: url,
                method: 'GET'
            })
            .flush(configuration, {
                status: 200,
                statusText: ''
            });

        tick();

        expect(sharedService.getStackTrace()).toBeTruthy();
        expect(factory.calls()).toBe(2);
        expect(raidenConfig.config.web3).toBe(
            raidenConfig.config.web3_fallback
        );
    }));
});
