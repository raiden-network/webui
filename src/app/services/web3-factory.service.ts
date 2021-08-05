import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { provider } from 'web3-core';
import detectEthereumProvider from '@metamask/detect-provider';

@Injectable()
export class Web3Factory {
    create(web3Provider: provider): Web3 {
        return new Web3(web3Provider);
    }

    /* istanbul ignore next */
    detectProvider(): Promise<unknown> {
        return detectEthereumProvider();
    }
}
