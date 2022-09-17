import { BlockTarget, BlockTargetGenerator } from './blocker';

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

export class GoogleBlockTargetGenerator extends BlockTargetGenerator {
    constructor() {
        super()
    }

    *getTargets(): Generator<HTMLElement> {
        const elements = Array.from(document.querySelectorAll('#search .g'));

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
}
