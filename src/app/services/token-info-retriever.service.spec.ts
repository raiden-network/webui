import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, async } from '@angular/core/testing';
import { MockConfig } from '../components/channel-table/channel-table.component.spec';
import { RaidenConfig } from './raiden.config';
import { SharedService } from './shared.service';

import { TokenInfoRetrieverService } from './token-info-retriever.service';
// @ts-ignore
import * as Web3 from 'web3';

describe('TokenInfoRetriever', () => {
    let service: TokenInfoRetrieverService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                HttpClientTestingModule
            ],
            providers: [
                TokenInfoRetrieverService,
                SharedService,
                {
                    provide: RaidenConfig,
                    useClass: MockConfig
                },
            ]
        });

        const config = TestBed.get(RaidenConfig);
        config.web3 = new Web3();
        service = TestBed.get(TokenInfoRetrieverService);
    });

    it('should be truthy', async(() => {
        expect(service).toBeTruthy();
    }));

    it('should reject promise if there is a JSON RPC response error', (done) => {
        const promise = service.createBatch([
            '0x0f114a1e9db192502e7856309cc899952b3db1ed'
        ], '0x82641569b2062B545431cF6D7F0A418582865ba7');
        promise.then(value => {
            fail(value);
            done();
        }).catch(reason => {
            const error = (reason as Error);
            expect(error.message).toContain('Invalid JSON RPC response');
            done();
        });
    });

    it('should ', () => {

    });
});
