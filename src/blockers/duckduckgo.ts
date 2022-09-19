import { BlockTarget, SiteSetting } from './blocker';
import * as util from '../util';

export class DuckDuckGoBlockTarget extends BlockTarget {
    constructor(root: HTMLElement) {
        super(root);
    }

    public getTitle(): string | null {
        return this.root.querySelector('h2')?.textContent?.trim() ?? null;
    }

    public getUrl(): URL | null {
        const url = (this.root.querySelector('h2 a') as HTMLAnchorElement)?.href ?? null;
        if (!url)
            return null;

        return new URL(url);
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

    public get name(): string {
        return 'duckduckgo';
    }

    public match(): boolean {
        return location.hostname.split('.').includes('duckduckgo') &&
            !util.isMobile();
    }

    public createRootContainer(): HTMLElement {
        const searchElement = document.querySelector('#links');
        if (!searchElement) {
            throw new Error('couldn\'t find parent element');
        }

        const container = document.createElement('div');
        searchElement.appendChild(container);
        return container;
    }

    getTargets(): BlockTarget[] {
        const elements = Array.from(document.querySelectorAll('#links article'));
        const blockTargets: BlockTarget[] = [];

        for (const element of elements) {
            if (!(element instanceof HTMLElement && element.parentElement instanceof HTMLElement)) {
                continue;
            }

            blockTargets.push(new DuckDuckGoBlockTarget(element.parentElement));
        }

        return blockTargets;
    }

    public createBlockTarget(root: HTMLElement): BlockTarget {
        return new DuckDuckGoBlockTarget(root);
    }

    public observeMutate(onAdded: (blockTargets: BlockTarget[]) => void): void {
        /* stop observing if exists */
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }

        this.mutationObserver = new MutationObserver((records: MutationRecord[]) => {
            const blockTargets: BlockTarget[] = [];
            const ancestorElement = document.querySelector('#links');

            for (const record of records) {
                for (const node of Array.from(record.addedNodes)) {
                    if (!(node instanceof HTMLElement)) continue;
                    if (!(node.tagName === 'ARTICLE')) continue;
                    if (!(!ancestorElement || ancestorElement.contains(node))) continue;
                    if (!(node.parentElement instanceof HTMLElement)) continue;

                    try {
                        /**
                         * 子孫要素が構築される前に呼び出された場合はスキップする
                         */
                        const blockTarget = this.createBlockTarget(node.parentElement);
                        blockTargets.push(blockTarget);
                    } catch (error) {
                        console.warn(error);
                    }
                }
            }

            if (blockTargets.length > 0) {
                console.log(blockTargets);
                onAdded(blockTargets);
            }
        });

        this.mutationObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    }
}
