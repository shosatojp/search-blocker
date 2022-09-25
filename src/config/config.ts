import { CommentRule, EmptyRule, FunctionRule, HostNameRule, RegExpRule, Rule } from '../rule';
import { BlockTarget } from '../blockers/blocker';
import * as p from '../parser/parser';

export const CONFIG_KEY = 'config-v2';

export const configParser = (() => {
    const lineEnd = p.or(p.char('\n'), p.eof()).supress();
    const charsPrintableNotNewline = p.charsExclude(p.charsPrintable, '\n');
    const charsNotSlash = p.charsExclude(charsPrintableNotNewline, '/');
    const whiteInline = p.white(p.charsExclude(p.charsWhite, '\n'));

    /* function rule */
    const doubleQuotedString = p.quoted('"', '\\', new Map([
        ['n', '\n'],
        ['t', '\t'],
        ['"', '"'],
    ]));
    const singleQuotedString = p.quoted('\'', '\\', new Map([
        ['n', '\n'],
        ['t', '\t'],
        ['\'', '\''],
    ]));
    const num = p.word(p.charsNumber);
    const identifer = p.word();
    const value = p.or(
        p.or(singleQuotedString, doubleQuotedString),
        num.map(r => Number(r.str))
    );
    const spacing = p.white().supress();
    const arglist = p.delimited(value, p.combine(spacing, p.char(',').supress(), spacing));
    const func = p.combine(identifer, spacing, p.char('(').supress(), spacing, arglist, spacing, p.char(')').supress())
        .map(r => {
            const funcname = r.children[0].str;
            const args = r.children[1].data;
            console.log(funcname, args);
            return [funcname, args];
        });

    const functionRule =
        p.combine(p.char('$').supress(), func, lineEnd.noConsume())
            .map(r => new FunctionRule((r.data as string[][])[0][0], (r.data as unknown[][][])[0][1]));

    /* hostname rule */
    const domainFragment = p.word(p.charsAlphaNum + '-');
    const hostname =
        p.delimited(domainFragment.named('fragment'), p.char('.'))
            .map(result => result.getNameAll('fragment').map(e => e.str))
            .named('hostname')
            .flatten();

    const path =
        p.combine(
            p.combine(p.char('/'), p.word(charsNotSlash).named('fragment'))
                .zeroOrMore()
                .map(result => result.getNameAll('fragment').map(e => e.str))
                .named('path'),
            p.char('/').optional()
        )
            .map(result => result.getName('path')?.data)
            .named('path')
            .flatten();

    const hostnameRule =
        p.combine(hostname, path.optional(), lineEnd.noConsume())
            .map(result => new HostNameRule(
                result.getName('hostname')?.data,
                result.getName('path')?.data
            ));

    /* regexp rule */
    const regexp = p.quoted('/', '\\', new Map([
        ['\\', '\\\\'],
        ['/', '/'],
    ])).map(result => new RegExp(result.str))
        .named('regexp');

    const regexRule =
        p.combine(regexp, lineEnd.noConsume())
            .map(result => {
                const source = result.getName('regexp')?.data;
                return source ? new RegExpRule(source) : null;
            })
            .flatten();

    /* empty rule */
    const emptyRule =
        p.combine(whiteInline, lineEnd.noConsume())
            .map(() => new EmptyRule())
            .flatten()
            .supress();

    /* comment rule */
    const commentRule =
        p.combine(whiteInline, p.char('#'), whiteInline, p.word(charsPrintableNotNewline), lineEnd.noConsume())
            .map(result => new CommentRule(result.str))
            .flatten()
            .supress();

    const ruleParser =
        p.or(functionRule, hostnameRule, regexRule, emptyRule, commentRule)
            .named('rule')
            .map(result => result.children[0].data);

    const configParser = p.combine(p.zeroOrMore(p.combine(ruleParser, lineEnd)), p.eof())
        .map(result => result.getNameAll('rule').map(e => e.data));

    return configParser;
})();

export class Config {
    private rules: Rule[];

    constructor(text: string) {
        this.rules = Config.loadString(text);
    }

    public get text(): string {
        return Array.from(this.rules.values())
            .map(e => e.toString())
            .join('\n');
    }

    addRule(rule: Rule) {
        this.rules.push(rule);
    }

    deleteRule(rule: Rule) {
        const idx = this.rules.findIndex(e => e === rule);
        if (idx >= 0)
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

    private static loadString(text: string): Rule[] {
        const output = configParser.parseString(text);

        if (!output.matched) {
            throw new Error('config syntax error');
        }

        const rules: Rule[] = [];

        for (const rule of (output.result.data)) {
            if (rule)
                rules.push(rule);
        }

        return rules;
    }

    public static default(): Config {
        return new Config('');
    }
}
