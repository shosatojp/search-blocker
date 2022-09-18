import { BlockTarget } from "./blockers/blocker";

export interface RuleOptions {
    hostname?: string;
    script?: string;
}

export class Rule {
    private options: RuleOptions;

    constructor(options: RuleOptions = {}) {
        this.options = options;
    }

    /**
     * match all
     */
    match(target: BlockTarget): boolean {
        if (this.options.hostname && !Rule.matchHostname(this.options.hostname, target.url.hostname)) {
            return false;
        }

        if (this.options.script && !Rule.matchFunction(target, this.options.script)) {
            return false;
        }

        return true;
    }

    toString(): string {
        return `${this.options.hostname || ''}${this.options.script ? '$' + this.options.script : ''}`;
    }

    public static fromString(line: string): Rule | null {
        if (this.isComment(line) || this.isEmpty(line)) {
            return null;
        }

        const [hostname, script] = line.split('$');
        const rule = new Rule({ hostname, script });

        return rule;
    }

    private static isComment(line: string) {
        return line.startsWith('#');
    }

    private static isEmpty(line: string) {
        return line.trim().length == 0;
    }

    public static getCandidate(url: URL) {
        const candidates: Rule[] = [];

        /**
         * domains
         * - do not include tld only domain
         */
        const domainFragments = url.hostname.split('.');
        for (let i = 0; i < domainFragments.length - 1; i++) {
            const hostname = domainFragments.slice(i).join('.');
            candidates.push(new Rule({ hostname }));
        }

        return candidates;
    }

    /**
     * match hostname and its subdomains
     */
    private static matchHostname(ruleHostname: string, targetHostname: string): boolean {
        const ruleFragments = ruleHostname.split('.');
        const targetFragments = targetHostname.split('.');

        if (ruleFragments.length > targetFragments.length) {
            return false;
        }

        for (let i = 0; i < ruleFragments.length; i++) {
            if (targetFragments[targetFragments.length - 1 - i] !== ruleFragments[ruleFragments.length - 1 - i])
                return false;
        }

        return true;
    }

    private static matchFunction(target: BlockTarget, script: string): boolean {
        const inlineFunctions: object = this.createFunctions(target);
        const fn = new Function(...Object.keys(inlineFunctions), `return (${script})`);
        const ret = fn(...Object.values(inlineFunctions));

        return Boolean(ret);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    private static createFunctions(target: BlockTarget): { [key: string]: Function } {
        const intitle = (text: string) => {
            const title = target.getTitle();
            if (!title)
                return false;
            return title.includes(text);
        };

        return { intitle };
    }

    public static equal(a: Rule, b: Rule): boolean {
        return a.toString() === b.toString();
    }
}
