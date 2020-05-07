import { Pipe, PipeTransform } from '@angular/core';
import { UserToken } from '../models/usertoken';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'token',
})
export class TokenPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}

    transform(token?: UserToken): SafeHtml {
        return this.tokenToHtmlString(token);
    }

    private tokenToHtmlString(token?: UserToken): SafeHtml {
        if (!token) {
            return '';
        }
        let html = '';
        if (token.symbol) {
            html += `<span>${token.symbol}</span>`;
        }
        if (token.name) {
            html += `<span>${token.name}</span>`;
        }
        if (html) {
            html += `<span>${token.address}</span>`;
        } else {
            html = `<span></span><span>${token.address}</span>`;
        }
        html = `<span class="mat-option-text">${html}</span>`;
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}
