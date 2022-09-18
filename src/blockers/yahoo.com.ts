import { BlockTarget, SiteSetting } from './blocker';

export class YahooComBlockTarget extends BlockTarget {
    constructor(root: HTMLElement) {
        super(root);
    }

    public getTitle(): string | null {
        return this.root.querySelector('h3.title')?.textContent?.trim() ?? null;
    }

    public getUrl(): URL | null {
        const url = (this.root.querySelector('h3.title > a') as HTMLAnchorElement)?.href ?? null;
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

export class YahooComSiteSetting extends SiteSetting {
    public name(): string {
        return 'yahoo.com';
    }

    public match(): boolean {
        return location.hostname === 'search.yahoo.com';
    }

    public createRootContainer(): HTMLElement {
        const searchElement = document.querySelector('#main');
        if (!searchElement) {
            throw new Error('couldn\'t find parent element');
        }

        const container = document.createElement('div');
        searchElement.appendChild(container);
        return container;
    }

    *getTargets(): Generator<HTMLElement> {
        const elements = Array.from(document.querySelectorAll('#web ol.reg > li'));

        for (const element of elements) {
            if (!(element instanceof HTMLElement)) {
                continue;
            }

            if (!(element.querySelector('div.algo'))) {
                continue;
            }

            yield element;
        }
    }

    public createBlockTarget(root: HTMLElement): BlockTarget {
        return new YahooComBlockTarget(root);
    }
}
