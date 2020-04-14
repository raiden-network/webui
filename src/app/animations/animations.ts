import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';

export class Animations {
    static flyInOut = [
        trigger('flyInOut', [
            state('in', style({ opacity: 1, transform: 'translateX(0)' })),
            transition('void => *', [
                style({
                    opacity: 0,
                    transform: 'translateX(100%)',
                }),
                animate('0.2s ease-in'),
            ]),
            transition('* => void', [
                animate(
                    '0.2s ease-out',
                    style({
                        opacity: 0,
                        transform: 'translateX(100%)',
                    })
                ),
            ]),
        ]),
        trigger('flyInOutLeft', [
            state('in', style({ opacity: 1, transform: 'translateX(0)' })),
            transition('void => *', [
                style({
                    opacity: 0,
                    transform: 'translateX(-100%)',
                }),
                animate('0.2s ease-in'),
            ]),
            transition('* => void', [
                animate(
                    '0.2s ease-out',
                    style({
                        opacity: 0,
                        transform: 'translateX(-100%)',
                    })
                ),
            ]),
        ]),
    ];

    static easeInOut = [
        trigger('easeInOut', [
            state('in', style({ opacity: 1 })),
            transition('void => *', [
                style({
                    opacity: 0,
                }),
                animate('0.2s 0.1s ease-in'),
            ]),
            transition('* => void', [
                animate(
                    '0.2s 0.1s ease-out',
                    style({
                        opacity: 0,
                    })
                ),
            ]),
        ]),
    ];

    static fallDown = [
        trigger('fallDown', [
            state('in', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('void => *', [
                style({
                    opacity: 0,
                    transform: 'translateY(-100%)',
                }),
                animate('0.2s ease-in'),
            ]),
        ]),
    ];

    static stretchInOut = [
        trigger('stretchInOut', [
            state('in', style({ opacity: 1 })),
            transition('void => *', [
                style({
                    width: 0,
                    height: 0,
                    opacity: 0,
                }),
                animate('0.3s ease-in'),
            ]),
            transition('* => void', [
                animate(
                    '0.3s ease-out',
                    style({
                        width: 0,
                        height: 0,
                        opacity: 0,
                    })
                ),
            ]),
        ]),
    ];
}
