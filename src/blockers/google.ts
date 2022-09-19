import { BlockTarget, SiteSetting } from './blocker';
import * as util from '../util';

export class GoogleBlockTarget extends BlockTarget {
    constructor(root: HTMLElement) {
        super(root);
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
        const inner = this.root.querySelector('.g');
        if (!(inner instanceof HTMLElement)) {
            return;
        }

        inner.style.backgroundColor = on ? color : 'unset';
    }
}

export class GoogleSiteSetting extends SiteSetting {
    private mutationObserver: MutationObserver | null = null;

    public name(): string {
        return 'google';
    }

    public match(): boolean {
        return location.hostname.split('.').includes('google') &&
            !util.isMobile();
    }

    public createRootContainer(): HTMLElement {
        const searchElement = document.querySelector('#search');
        if (!searchElement) {
            throw new Error('couldn\'t find parent element');
        }

        const container = document.createElement('div');
        searchElement.appendChild(container);
        return container;
    }

    *getTargets(): Generator<HTMLElement> {
        const elements = Array.from(document.getElementsByClassName('g'));

        for (const element of elements) {
            if (!(element instanceof HTMLElement &&
                element.parentElement instanceof HTMLElement)) {
                continue;
            }
            if (element.querySelector('g-card') || element.tagName === 'G-CARD') {
                continue;
            }

            element.style.marginBottom = '0px';

            yield element.parentElement;
        }
    }

    public createBlockTarget(root: HTMLElement): BlockTarget {
        return new GoogleBlockTarget(root);
    }

    public observeMutate(onAdded: (blockTargets: BlockTarget[]) => void): void {
        const blockTargets: BlockTarget[] = [];

        /* stop observing if exists */
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }

        const observer = new MutationObserver((records: MutationRecord[]) => {
            for (const record of records) {
                for (const node of Array.from(record.addedNodes)) {
                    if (!(node instanceof HTMLElement)) continue;
                    if (!node.classList.contains('g')) continue;
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

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    }
}
