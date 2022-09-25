import { BlockTarget } from './blockers/blocker';

export abstract class Rule {
    public abstract match(target: BlockTarget): boolean;
    public abstract toString(): string;
    public static equal(a: Rule, b: Rule): boolean {
        return a.toString() === b.toString();
    }
}

export class FunctionRule extends Rule {
    funcname: string;
    args: unknown[];

    constructor(funcname: string, args: unknown[]) {
        super();
        this.funcname = funcname;
        this.args = args;
    }

    public match(target: BlockTarget): boolean {
        return this.matchFunction(target);
    }

    public toString(): string {
        return `$${this.funcname}(${this.args.map(e => FunctionRule.stringify(e)).join(', ')})`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static stringify(arg: any): string {
        if (arg instanceof RegExp) {
            return arg.toString();
        } else {
            return JSON.stringify(arg);
        }
    }

    private matchFunction(target: BlockTarget): boolean {
        const inlineFunctions = FunctionRule.createFunctions(target);
        const ret = inlineFunctions[this.funcname](...this.args);
        return Boolean(ret);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    private static createFunctions(target: BlockTarget): { [key: string]: Function } {
        const intitle = (text: string | RegExp) => {
            const title = target.title;
            if (!title) {
                return false;
            } else if (typeof text === 'string') {
                return title.includes(text);
            } else if (text instanceof RegExp) {
                return text.test(title);
            } else {
                return false;
            }
        };

        return { intitle };
    }
}

export class HostNameRule extends Rule {
    hostname: string[];
    path: string[];

    constructor(hostname: string[], path: string[] = []) {
        super();
        this.hostname = hostname;
        this.path = path;
    }

    public match(target: BlockTarget): boolean {
        if (!target.url) {
            return false;
        }

        if (!HostNameRule.matchHostname(this.hostname, target.url.hostname.split('.'))) {
            return false;
        }

        if (target.url.pathname.length === 0 ||
            !HostNameRule.matchPath(this.path, target.url.pathname.slice(1).split('/'))) {
            return false;
        }

        return true;
    }

    public toString(): string {
        return `${this.hostname.join('.')}${this.path.length > 0 ? '/' + this.path.join('/') : ''}`;
    }

    public static getCandidate(url: URL): Rule[] {
        const candidates: Rule[] = [];

        /**
         * domains
         * - do not include tld only domain
         */
        const domainFragments = url.hostname.split('.');
        for (let i = 0; i < domainFragments.length - 1; i++) {
            const _domainFragments = domainFragments.slice(i);
            candidates.push(new HostNameRule(_domainFragments));
        }

        return candidates;
    }

    /**
     * match hostname and its subdomains
     */
    private static matchHostname(ruleFragments: string[], targetFragments: string[]): boolean {
        if (ruleFragments.length > targetFragments.length) {
            return false;
        }

        for (let i = 0; i < ruleFragments.length; i++) {
            if (targetFragments[targetFragments.length - 1 - i] !== ruleFragments[ruleFragments.length - 1 - i])
                return false;
        }

        return true;
    }

    private static matchPath(ruleFragments: string[], targetFragments: string[]) {
        if (ruleFragments.length > targetFragments.length) {
            return false;
        }

        for (let i = 0; i < ruleFragments.length; i++) {
            if (ruleFragments[i] === '*')
                continue;

            if (targetFragments[i] !== ruleFragments[i])
                return false;
        }

        return true;
    }
}

export class EmptyRule extends Rule {
    public match(_target: BlockTarget): boolean {
        return false;
    }

    public toString(): string {
        return '';
    }
}

export class CommentRule extends Rule {
    comment: string;

    constructor(comment: string) {
        super();
        this.comment = comment;
    }

    public match(_target: BlockTarget): boolean {
        return false;
    }

    public toString(): string {
        return this.comment;
    }
}

export class RegExpRule extends Rule {
    regexp: RegExp;

    constructor(regexp: RegExp) {
        super();
        this.regexp = regexp;
    }

    public match(target: BlockTarget): boolean {
        const url = target.url?.toString();
        if (!url)
            return false;

        return this.regexp.test(url);
    }

    public toString(): string {
        return this.regexp.toString();
    }
}
