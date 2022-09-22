import { BlockTarget, SiteSetting } from './blocker';
import * as util from '../util';

class GoogleMobileBlockTarget extends BlockTarget {
    initialBackgroundColor: string;

    constructor(root: HTMLElement) {
        super(root);
        this.initialBackgroundColor = root.style.backgroundColor;
    }

    public getTitle(): string | null {
        return this.root.querySelector('a')?.textContent?.trim() ?? null;
    }

    public getUrl(): URL | null {
        const url = this.root.querySelector('a')?.href ?? null;
        if (!url)
            return null;

        return new URL(url);
    }

    public hide(hidden: boolean): void {
        this.root.style.display = hidden ? 'none' : 'block';
    }

    public highlight(on: boolean, color: string): void {
        this.root.style.backgroundColor = on ? color : this.initialBackgroundColor;
    }
}

export class GoogleMobileSiteSetting extends SiteSetting {
    private mutationObserver: MutationObserver | null = null;
    private blockTargetsCache: Map<HTMLElement, BlockTarget> = new Map<HTMLElement, BlockTarget>();

    public get name(): string {
        return 'google-mobile';
    }

    public match(): boolean {
        return location.hostname.split('.').includes('google') && util.isMobile();
    }

    public createRootContainer(): HTMLElement {
        const searchElement = document.querySelector('#topstuff');
        if (!searchElement) {
            throw new Error('couldn\'t find parent element');
        }

        const container = document.createElement('div');
        container.style.margin = '20px';
        searchElement.appendChild(container);
        return container;
    }

    getTargets(_elements?: Element[]): BlockTarget[] {
        const elements = _elements || Array.from(document.getElementsByClassName('xpd'));

        /* return if no change in number of target elements */
        if (elements.length === this.blockTargetsCache.size) {
            return Array.from(this.blockTargetsCache.values());
        }

        for (const element of elements) {
            if (!(element instanceof HTMLElement)) {
                continue;
            }

            if (!this.blockTargetsCache.has(element))
                this.blockTargetsCache.set(element,
                    new GoogleMobileBlockTarget(element));
        }

        return Array.from(this.blockTargetsCache.values());
    }

    public observeMutate(onAdded: (blockTargets: BlockTarget[]) => void): void {
        /* stop observing if exists */
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }

        this.mutationObserver = new MutationObserver((_records: MutationRecord[]) => {
            const prevNumTargets = this.blockTargetsCache.size;
            const currTargetElements = document.getElementsByClassName('xpd');
            if (prevNumTargets !== currTargetElements.length) {
                const blockTargets = this.getTargets(Array.from(currTargetElements));
                onAdded(blockTargets);
            }
        });

        this.mutationObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    }
}

