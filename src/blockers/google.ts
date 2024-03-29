import { BlockTarget, SiteSetting } from './blocker';
import * as util from '../util';

class GoogleBlockTarget extends BlockTarget {
    inner: HTMLElement | null;

    constructor(root: HTMLElement) {
        super(root);

        this.inner = root.querySelector('.g');
    }

    public getTitle(): string | null {
        return this.root.querySelector('h3')?.textContent?.trim() ?? null;
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
        this.root.style.backgroundColor = on ? color : 'unset';

        if (this.inner)
            this.inner.style.backgroundColor = on ? color : 'unset';
    }
}

export class GoogleSiteSetting extends SiteSetting {
    private mutationObserver: MutationObserver | null = null;
    private blockTargetsCache: Map<HTMLElement, BlockTarget> = new Map<HTMLElement, BlockTarget>();

    public get name(): string {
        return 'google';
    }

    public match(): boolean {
        return location.hostname.split('.').includes('google') &&
            !util.isMobile();
    }

    public createRootContainer(): HTMLElement {
        /* use parent of #search not to observe MainControl changes */
        const searchElement = document.getElementById('search')?.parentElement;
        if (!searchElement) {
            throw new Error('couldn\'t find parent element');
        }

        const container = document.createElement('div');
        searchElement.appendChild(container);
        return container;
    }

    getTargets(_elements?: Element[]): BlockTarget[] {
        const elements = _elements ||
            Array.from(
                (document.getElementById('search') || document.documentElement)
                    .getElementsByClassName('g'));

        /* return if no change in number of target elements */
        if (elements.length === this.blockTargetsCache.size) {
            return Array.from(this.blockTargetsCache.values());
        }

        for (const element of elements) {
            if (!(element instanceof HTMLElement &&
                element.parentElement instanceof HTMLElement)) {
                continue;
            }
            if (element.querySelector('g-card') || element.tagName === 'G-CARD') {
                continue;
            }

            element.style.marginBottom = '0px';

            if (!this.blockTargetsCache.has(element.parentElement))
                this.blockTargetsCache.set(element.parentElement,
                    new GoogleBlockTarget(element.parentElement));
        }

        return Array.from(this.blockTargetsCache.values());
    }

    public observeMutate(onAdded: (blockTargets: BlockTarget[]) => void): void {
        /* stop observing if exists */
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }

        const root = document.getElementById('rcnt') || document.documentElement;

        this.mutationObserver = new MutationObserver((_records: MutationRecord[]) => {
            const prevNumTargets = this.blockTargetsCache.size;
            const currTargetElements = root.getElementsByClassName('g');
            if (prevNumTargets !== currTargetElements.length) {
                this.blockTargetsCache.clear();
                const blockTargets = this.getTargets(Array.from(currTargetElements));
                onAdded(blockTargets);
            }
        });

        this.mutationObserver.observe(root, {
            childList: true,
            subtree: true,
        });
    }
}
