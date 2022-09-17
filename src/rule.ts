import { BlockTarget } from "./blockers/blocker";

export class Rule {
    hostname: string;

    constructor(hostname: string) {
        this.hostname = hostname;
    }

    /**
     * match all
     */
    match(target: BlockTarget): boolean {
        if (!Rule.matchHostname(this.hostname, target.url.hostname)) {
            return false;
        }

        return true;
    }

    toString(): string {
        return `${this.hostname}`;
    }

    public static fromString(line: string): Rule | null {
        if (this.isComment(line) || this.isEmpty(line)) {
            return null;
        }

        const [hostname, script] = line.split('$');
        const rule = new Rule(hostname);

        return rule;
    }

    public static isComment(line: string) {
        return line.startsWith('!');
    }

    public static isEmpty(line: string) {
        return line.trim().length == 0;
    }

    public static getCandidate(url: URL) {
        const candidates: Rule[] = [];

        /**
         * domains
         */
        const domainFragments = url.hostname.split('.');
        for (let i = 0; i < domainFragments.length; i++) {
            const hostname = domainFragments.slice(i).join('.');
            candidates.push(new Rule(hostname));
        }

        return candidates;
    }

    /**
     * match hostname and its subdomains
     */
    public static matchHostname(ruleHostname: string, targetHostname: string): boolean {
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

    public static equal(a: Rule, b: Rule): boolean {
        return a.hostname === b.hostname;
    }
}
