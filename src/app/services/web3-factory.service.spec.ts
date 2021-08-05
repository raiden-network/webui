import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, fakeAsync } from '@angular/core/testing';
import Web3 from 'web3';
import { Web3Factory } from './web3-factory.service';
import { HttpProvider } from 'web3-core';

describe('Web3Factory', () => {
    let web3Factory: Web3Factory;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [Web3Factory],
        });

        web3Factory = TestBed.inject(Web3Factory);
    });

    it('should be created', () => {
        expect(web3Factory).toBeTruthy();
    });

    it('should create a new web3 instance', fakeAsync(() => {
        const web3 = web3Factory.create(
            new Web3.providers.HttpProvider('http://localhost:8485')
        );
        expect((web3.currentProvider as HttpProvider).host).toBe(
            'http://localhost:8485'
        );
    }));
});
