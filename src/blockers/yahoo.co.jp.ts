import { BlockTarget, SiteSetting } from './blocker';

class YahooCoJpBlockTarget extends BlockTarget {
    public getTitle(): string | null {
        return this.root.querySelector('.sw-Card__title')?.textContent?.trim() ?? null;
    }

    public getUrl(): URL | null {
        const url = (this.root.querySelector('.sw-Card__title > a') as HTMLAnchorElement)?.href ?? null;
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

export class YahooCoJpComSiteSetting extends SiteSetting {
    public get name(): string {
        return 'yahoo.co.jp';
    }

    public match(): boolean {
        return location.hostname === 'search.yahoo.co.jp';
    }

    public createRootContainer(): HTMLElement {
        const searchElement = document.querySelector('#contents .Contents__inner');
        if (!searchElement) {
            throw new Error('couldn\'t find parent element');
        }

        const container = document.createElement('div');
        searchElement.appendChild(container);
        return container;
    }

    getTargets(): BlockTarget[] {
        const elements = Array.from(document.querySelectorAll('#contents .Contents__inner .Contents__innerGroupBody .sw-CardBase .sw-Card'));
        const blockTargets: BlockTarget[] = [];

        for (const element of elements) {
            if (!(element instanceof HTMLElement)) {
                continue;
            }

            blockTargets.push(new YahooCoJpBlockTarget(element));
        }

        return blockTargets;
    }
}
