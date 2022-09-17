import { Rule } from "./rule";
import { BlockTarget } from './blockers/blocker';

export class Config {
    rules: Rule[];

    constructor(rules: Rule[]) {
        this.rules = rules;
    }

    dumpString(): string {
        const lines: string[] = [];
        for (const rule of this.rules) {
            lines.push(rule.toString());
        }
        return lines.join('\n');
    }

    addRule(rule: Rule) {
        this.rules.push(rule);
    }

    deleteRule(rule: Rule) {
        const idx = this.rules.findIndex((v) => Rule.equal(v, rule));
        this.rules.splice(idx, 1);
    }

    /**
     * match any
     */
    match(target: BlockTarget): Rule | null {
        for (const rule of this.rules) {
            if (rule.match(target)) {
                return rule;
            }
        }
        return null;
    }

    public static loadString(src: string): Config {
        const rules: Rule[] = [];

        for (const line of src.trim().split('\n')) {
            const rule = Rule.fromString(line.trim());
            if (!rule)
                continue;

            rules.push(rule);
        }

        const config = new Config(rules);
        return config;
    }

    public static loadObject(obj: Config): Config {
        Object.setPrototypeOf(obj, Config.prototype);
        for (const rule of obj.rules) {
            Object.setPrototypeOf(rule, Rule.prototype);
        }
        return obj;
    }

    public static default(): Config {
        return new Config([]);
    }
}
