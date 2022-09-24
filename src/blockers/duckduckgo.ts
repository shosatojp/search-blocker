import { BlockTarget, SiteSetting } from './blocker';
import * as util from '../util';

class DuckDuckGoBlockTarget extends BlockTarget {
    public getTitle(): string | null {
        return this.root.querySelector('h2')?.textContent?.trim() ?? null;
    }

    public getUrl(): URL | null {
        const url = (this.root.querySelector('h2 a') as HTMLAnchorElement)?.href ?? null;
        return url === null ? null : new URL(url);
    }

    public hide(hidden: boolean): void {
        this.root.style.display = hidden ? 'none' : 'block';
    }

    public highlight(on: boolean, color: string): void {
        this.root.style.backgroundColor = on ? color : 'unset';
    }
}

export class DuckDuckGoSiteSetting extends SiteSetting {
    private mutationObserver: MutationObserver | null = null;
    private blockTargetsCache: Map<HTMLElement, BlockTarget> = new Map<HTMLElement, BlockTarget>();

    public get name(): string {
        return 'duckduckgo';
    }

    public match(): boolean {
        return location.hostname.split('.').includes('duckduckgo') &&
            !util.isMobile();
    }

    public createRootContainer(): HTMLElement {
        const searchElement = document.getElementById('links');
        if (!searchElement) {
            throw new Error('couldn\'t find parent element');
        }

        const container = document.createElement('div');
        searchElement.appendChild(container);
        return container;
    }

    getTargets(_elements?: Element[]): BlockTarget[] {
        const elements = _elements || Array.from(document.getElementById('links')?.getElementsByTagName('article') || []);

        for (const element of elements) {
            if (!(element instanceof HTMLElement &&
                element.parentElement instanceof HTMLElement)) {
                continue;
            }

            if (!this.blockTargetsCache.has(element.parentElement))
                this.blockTargetsCache.set(element.parentElement,
                    new DuckDuckGoBlockTarget(element.parentElement));
        }

        return Array.from(this.blockTargetsCache.values());
    }

    public observeMutate(onAdded: (blockTargets: BlockTarget[]) => void): void {
        /* stop observing if exists */
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }

        const root = document.getElementById('links') || document.documentElement;

        this.mutationObserver = new MutationObserver((_records: MutationRecord[]) => {
            const prevNumTargets = this.blockTargetsCache.size;
            const currTargetElements = root === document.documentElement
                ? document.getElementById('links')?.getElementsByTagName('article')
                : document.getElementsByTagName('article');
            if (currTargetElements && prevNumTargets !== currTargetElements.length) {
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
