import { BlockTarget, SiteSetting } from './blocker';

export class BingBlockTarget extends BlockTarget {
    constructor(root: HTMLElement) {
        super(root);
    }

    public getTitle(): string | null {
        return this.root.querySelector('.b_title')?.textContent?.trim() ?? null;
    }

    public getUrl(): URL | null {
        const url = (this.root.querySelector('.b_title > a') as HTMLAnchorElement)?.href ?? null;
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

export class BingSiteSetting extends SiteSetting {
    public name(): string {
        return 'bing';
    }

    public match(): boolean {
        return location.hostname.split('.').includes('bing');
    }

    public createRootContainer(): HTMLElement {
        const searchElement = document.querySelector('#b_results');
        const container = document.createElement('div');

        searchElement!.appendChild(container);

        return container;
    }

    *getTargets(): Generator<HTMLElement> {
        const elements = Array.from(document.querySelectorAll('ol#b_results > li.b_algo'));

        for (const element of elements) {
            if (!(element instanceof HTMLElement)) {
                continue;
            }

            yield element;
        }
    }

    public createBlockTarget(root: HTMLElement): BlockTarget {
        return new BingBlockTarget(root);
    }
}
