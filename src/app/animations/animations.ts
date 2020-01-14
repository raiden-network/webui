import {
    animate,
    state,
    style,
    transition,
    trigger
} from '@angular/animations';

export class Animations {
    static flyInOut = [
        trigger('flyInOut', [
            state('in', style({ opacity: 1, transform: 'translateX(0)' })),
            transition('void => *', [
                style({
                    opacity: 0,
                    transform: 'translateX(100%)'
                }),
                animate('0.2s ease-in')
            ]),
            transition('* => void', [
                animate(
                    '0.2s ease-out',
                    style({
                        opacity: 0,
                        transform: 'translateX(100%)'
                    })
                )
            ])
        ]),
        trigger('flyInOutLeft', [
            state('in', style({ opacity: 1, transform: 'translateX(0)' })),
            transition('void => *', [
                style({
                    opacity: 0,
                    transform: 'translateX(-100%)'
                }),
                animate('0.2s ease-in')
            ]),
            transition('* => void', [
                animate(
                    '0.2s ease-out',
                    style({
                        opacity: 0,
                        transform: 'translateX(-100%)'
                    })
                )
            ])
        ])
    ];

    static easeInOut = [
        trigger('easeInOut', [
            state('in', style({ opacity: 1 })),
            transition('void => *', [
                style({
                    opacity: 0
                }),
                animate('0.2s 0.1s ease-in')
            ]),
            transition('* => void', [
                animate(
                    '0.2s 0.1s ease-out',
                    style({
                        opacity: 0
                    })
                )
            ])
        ])
    ];
}
