import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ElementRef,
    HostListener,
    AfterViewInit,
} from '@angular/core';
import { UserToken } from '../../models/usertoken';
import { TokenPollingService } from '../../services/token-polling.service';
import { Observable, EMPTY, Subject } from 'rxjs';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { TokenUtils } from '../../utils/token.utils';
import { SelectedTokenService } from '../../services/selected-token.service';
import { Network } from '../../utils/network-info';
import { RaidenService } from '../../services/raiden.service';
import { map, flatMap, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { RegisterDialogComponent } from '../register-dialog/register-dialog.component';
import { AnimationBuilder, animate, style } from '@angular/animations';
import { SharedService } from '../../services/shared.service';
import { matchesToken } from '../../shared/keyword-matcher';

interface AllNetworksView {
    allNetworksView: boolean;
}

@Component({
    selector: 'app-token-carousel',
    templateUrl: './token-carousel.component.html',
    styleUrls: ['./token-carousel.component.css'],
})
export class TokenCarouselComponent
    implements OnInit, OnDestroy, AfterViewInit {
    private static TOKEN_VIEW_WIDTH = 298;

    @ViewChild('carousel', { static: true }) private carousel: ElementRef;
    @ViewChild('visible_section', { static: true })
    private visibleSection: ElementRef;

    visibleItems: Array<UserToken | AllNetworksView> = [];
    currentItem = 0;
    visibleSectionItems = 1;
    currentSelection: UserToken | AllNetworksView = { allNetworksView: true };
    totalItems = 1;
    totalChannels = 0;
    readonly network$: Observable<Network>;

    private ngUnsubscribe = new Subject();
    private searchFilter = '';
    private tokens: UserToken[] = [];

    constructor(
        private tokenPollingService: TokenPollingService,
        private channelPollingService: ChannelPollingService,
        private selectedTokenService: SelectedTokenService,
        private raidenService: RaidenService,
        private dialog: MatDialog,
        private animationBuilder: AnimationBuilder,
        private sharedService: SharedService
    ) {
        this.network$ = raidenService.network$;
    }

    get production(): boolean {
        return this.raidenService.production;
    }

    ngOnInit() {
        this.tokenPollingService.tokens$
            .pipe(
                map((tokens) =>
                    tokens.sort((a, b) => TokenUtils.compareTokens(a, b))
                ),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((tokens: UserToken[]) => {
                this.tokens = tokens;
                this.totalItems = tokens.length + 1;
                this.updateVisibleTokens();
            });

        this.channelPollingService.channels$
            .pipe(
                map((channels) =>
                    channels.filter(
                        (channel) =>
                            channel.state === 'opened' ||
                            channel.state === 'waiting_for_open'
                    )
                ),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((channels) => {
                this.totalChannels = channels.length;
            });

        this.selectedTokenService.selectedToken$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((token) => {
                this.currentSelection = token
                    ? token
                    : { allNetworksView: true };

                this.moveSelectionIntoView();
            });

        this.sharedService.searchFilter$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((value) => {
                this.searchFilter = value;
                this.updateVisibleTokens();
                this.moveSelectionIntoView();
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    ngAfterViewInit() {
        this.calculateVisibleSectionItems();
        this.moveSelectionIntoView();
    }

    @HostListener('window:resize', ['$event'])
    onResize() {
        this.calculateVisibleSectionItems();
        this.moveSelectionIntoView();
    }

    trackByFn(index, item: UserToken | AllNetworksView) {
        return 'address' in item ? item.address : '0';
    }

    next() {
        if (
            this.currentItem + this.visibleSectionItems >=
            this.visibleItems.length
        ) {
            return;
        }
        this.currentItem++;
        this.playAnimation();
    }

    previous() {
        if (this.currentItem <= 0) {
            return;
        }
        this.currentItem--;
        this.playAnimation();
    }

    isAllNetworksView(object: any): object is AllNetworksView {
        if (!object) {
            return false;
        }
        return 'allNetworksView' in object;
    }

    getNumberOfChannels(item: UserToken | AllNetworksView) {
        if (this.isAllNetworksView(item)) {
            return this.totalChannels;
        } else if (item.connected) {
            return item.connected.channels;
        } else {
            return 0;
        }
    }

    isSelected(item: UserToken | AllNetworksView) {
        if (!this.isAllNetworksView(this.currentSelection)) {
            return (
                !this.isAllNetworksView(item) &&
                this.currentSelection.address === item.address
            );
        } else {
            return this.isAllNetworksView(item);
        }
    }

    select(item: UserToken | AllNetworksView) {
        const selectedToken = this.isAllNetworksView(item) ? undefined : item;
        this.selectedTokenService.setToken(selectedToken);
        this.moveSelectionIntoView();
    }

    register() {
        const dialog = this.dialog.open(RegisterDialogComponent, {
            width: '360px',
        });

        dialog
            .afterClosed()
            .pipe(
                flatMap((tokenAddress: string) => {
                    if (!tokenAddress) {
                        return EMPTY;
                    }

                    return this.raidenService.registerToken(tokenAddress);
                })
            )
            .subscribe(() => {
                this.tokenPollingService.refresh();
            });
    }

    private playAnimation() {
        const offset =
            this.currentItem * TokenCarouselComponent.TOKEN_VIEW_WIDTH;
        const animation = this.animationBuilder.build([
            animate(
                '250ms ease-in',
                style({ transform: `translateX(-${offset}px)` })
            ),
        ]);
        animation.create(this.carousel.nativeElement).play();
    }

    private updateVisibleTokens() {
        const filteredTokens = this.tokens.filter((item) =>
            matchesToken(this.searchFilter, item)
        );
        this.visibleItems = [{ allNetworksView: true }, ...filteredTokens];
    }

    private calculateVisibleSectionItems() {
        const sectionWidth = this.visibleSection.nativeElement.getBoundingClientRect()
            .width;
        this.visibleSectionItems = Math.floor(
            sectionWidth / TokenCarouselComponent.TOKEN_VIEW_WIDTH
        );
    }

    private moveSelectionIntoView() {
        const selectionIndex = this.findSelectionIndex();
        const firstVisible = this.currentItem;
        const lastVisible = this.currentItem + this.visibleSectionItems - 1;
        if (selectionIndex > lastVisible) {
            this.currentItem += selectionIndex - lastVisible;
            this.playAnimation();
        } else if (selectionIndex < firstVisible) {
            this.currentItem -= firstVisible - selectionIndex;
            this.playAnimation();
        }
    }

    private findSelectionIndex(): number {
        let selectionIndex = 0;
        if (!this.isAllNetworksView(this.currentSelection)) {
            const currentSelection = this.currentSelection;
            const visibleTokens = this.visibleItems.slice(1) as UserToken[];
            selectionIndex = visibleTokens.findIndex(
                (token) => token.address === currentSelection.address
            );
            selectionIndex++;
        }
        return selectionIndex;
    }
}
