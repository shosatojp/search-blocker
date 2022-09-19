export abstract class BlockTarget {
    protected _root: HTMLElement;
    protected _url: URL | null = null;

    constructor(root: HTMLElement) {
        this._root = root;
    }

    public abstract getTitle(): string | null;
    public abstract getUrl(): URL | null;
    public abstract highlight(on: boolean, color: string): void;
    public abstract hide(hidden: boolean): void;

    public get url(): URL | null {
        if (!this._url) {
            const url = this.getUrl();
            if (url)
                this._url = url;
        }

        return this._url;
    }

    public get root(): HTMLElement {
        return this._root;
    }
}

export abstract class SiteSetting {
    public abstract get name(): string;
    public abstract match(): boolean;
    public abstract createRootContainer(): HTMLElement;
    public abstract getTargets(): BlockTarget[];
    public observeMutate(_onAdded: (blockTargets: BlockTarget[]) => void): void {
        console.debug('not impremented');
    }
}
