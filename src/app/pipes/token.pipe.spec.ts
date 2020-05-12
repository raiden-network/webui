import { TokenPipe } from './token.pipe';
import { TestBed, async } from '@angular/core/testing';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { createToken } from '../../testing/test-data';
import { UserToken } from '../models/usertoken';

describe('TokenPipe', () => {
    let pipe: TokenPipe;
    let sanitizer: DomSanitizer;
    let token: UserToken;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [BrowserModule],
        });
    }));

    beforeEach(() => {
        sanitizer = TestBed.inject(DomSanitizer);
        pipe = new TokenPipe(sanitizer);
        token = createToken();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should convert a user token to a html representation', () => {
        const tokenHtml = pipe.transform(token);
        const expected = sanitizer.bypassSecurityTrustHtml(
            `<span class="mat-option-text"><span>${token.symbol}</span><span>${token.name}</span><span>${token.address}</span></span>`
        );
        expect(tokenHtml).toEqual(expected);
    });

    it('should have the following format if symbol is missing', () => {
        token.symbol = null;
        const tokenHtml = pipe.transform(token);
        const expected = sanitizer.bypassSecurityTrustHtml(
            `<span class="mat-option-text"><span>${token.name}</span><span>${token.address}</span></span>`
        );
        expect(tokenHtml).toEqual(expected);
    });

    it('should have the following format if only address is available', () => {
        token.symbol = null;
        token.name = null;
        const tokenHtml = pipe.transform(token);
        const expected = sanitizer.bypassSecurityTrustHtml(
            `<span class="mat-option-text"><span></span><span>${token.address}</span></span>`
        );
        expect(tokenHtml).toEqual(expected);
    });
});
