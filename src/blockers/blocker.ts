export abstract class BlockTarget {
    protected root: HTMLElement;
    protected _url: URL;

    constructor(root: HTMLElement) {
        this.root = root;
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
}

export abstract class BlockTargetGenerator {
    constructor() { }

    public abstract getTargets(): Generator<HTMLElement>;
}
