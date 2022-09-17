export abstract class BlockTarget {
    protected _root: HTMLElement;
    protected _url: URL;

    constructor(root: HTMLElement) {
        this._root = root;
        const url = this.getUrl();
        if (!url)
            throw new Error('failed to get url');
        this._url = url;
    }

    public abstract getTitle(): string | null;
    public abstract getUrl(): URL | null;
    public abstract highlight(on: boolean, color: string): void;
    public abstract hide(hidden: boolean): void;

    public get url(): URL {
        return this._url;
    }

    public get root(): HTMLElement {
        return this._root;
    }
}

export abstract class SiteSetting {
    constructor() { }

    public abstract name(): string;
    public abstract match(): boolean;
    public abstract createRootContainer(): HTMLElement;
    public abstract getTargets(): Generator<HTMLElement>;
    public abstract createBlockTarget(root: HTMLElement): BlockTarget;
    public observeMutate(onAdded: (blockTarget: BlockTarget) => void): void {
        console.debug('not impremented');
    }
}
