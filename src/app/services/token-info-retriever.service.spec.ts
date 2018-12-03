import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, TestBed } from '@angular/core/testing';
import { MockConfig } from '../components/channel-table/channel-table.component.spec';
import { RaidenConfig } from './raiden.config';
import { SharedService } from './shared.service';

import { TokenInfoRetrieverService } from './token-info-retriever.service';
// @ts-ignore
import * as Web3 from 'web3';
import { UserToken } from "../models/usertoken";

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

    it('should fail with a JSON RPC response error', async () => {
        const userTokens: { [address: string]: UserToken | null } = {};

        try {
            await service.createBatch([
                '0x0f114A1E9Db192502E7856309cc899952b3db1ED'
            ], '0x82641569b2062B545431cF6D7F0A418582865ba7', userTokens);
            fail('There should be no result')
        } catch (e) {
            expect(e.message).toContain('Invalid JSON RPC response');
        }
    });
});
