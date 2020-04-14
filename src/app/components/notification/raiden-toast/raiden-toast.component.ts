import { Component } from '@angular/core';
import { Toast, ToastrService, ToastPackage } from 'ngx-toastr';
import {
    trigger,
    style,
    state,
    transition,
    animate,
} from '@angular/animations';

@Component({
    selector: 'app-raiden-toast',
    templateUrl: './raiden-toast.component.html',
    styleUrls: ['./raiden-toast.component.css'],
    animations: [
        trigger('flyInOut', [
            state('inactive', style({ opacity: 0 })),
            state('active', style({ opacity: 1 })),
            state(
                'removed',
                style({
                    opacity: 1,
                    width: 0,
                    height: 0,
                    transform: 'translateX(+300px)',
                })
            ),
            transition(
                'inactive => active',
                animate('{{ easeTime }}ms {{ easing }}')
            ),
            transition(
                'active => removed',
                animate('{{ easeTime }}ms ease-out')
            ),
        ]),
    ],
    preserveWhitespaces: false,
})
export class RaidenToastComponent extends Toast {
    constructor(
        protected toastrService: ToastrService,
        public toastPackage: ToastPackage
    ) {
        super(toastrService, toastPackage);
    }
}
