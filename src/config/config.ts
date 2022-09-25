import { CommentRule, EmptyRule, FunctionRule, HostNameRule, RegExpRule, Rule } from '../rule';
import { BlockTarget } from '../blockers/blocker';
import * as p from '../parser/parser';

export const CONFIG_KEY = 'config-v2';

export const configParser = (() => {
    const lineEnd = p.or(p.char('\n'), p.eof()).supress();
    const charsPrintableNotNewline = p.charsExclude(p.charsPrintable, '\n');
    const charsNotSlash = p.charsExclude(charsPrintableNotNewline, '/');
    const whiteInline = p.white(p.charsExclude(p.charsWhite, '\n'));
    const regexp = p.quoted('/', '\\', new Map([
        ['\\', '\\\\'],
        ['/', '/'],
    ])).map(result => new RegExp(result.str));

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
        num.map(r => Number(r.str)),
        regexp
    );
    const spacing = p.white().supress();
    const arglist = p.delimited(value, p.combine(spacing, p.char(',').supress(), spacing));
    const func = p.combine(identifer, spacing, p.char('(').supress(), spacing, arglist, spacing, p.char(')').supress())
        .map(r => {
            const funcname = r.children[0].str;
            const args = r.children[1].data;
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
    const regexRule =
        p.combine(regexp, lineEnd.noConsume())
            .map(result => {
                const source = (result.data as RegExp[])[0];
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
        p.combine(whiteInline, p.char('#'), p.word(charsPrintableNotNewline), lineEnd.noConsume())
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

export class ConfigSyntaxError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigSyntaxError';
    }
}

export class Config {
    private rules: Rule[] | null = null;
    private _text: string;
    readonly parserOutput: p.ParserOutput;

    constructor(text: string) {
        this._text = text;
        const [rules, output] = Config.loadString(text);
        this.rules = rules;
        this.parserOutput = output;
    }

    public get text(): string {
        if (this.rules === null) {
            return this._text;
        } else {
            return Array.from(this.rules.values())
                .map(e => e.toString())
                .join('\n');
        }
    }

    public get error(): boolean {
        return this.rules === null;
    }

    addRule(rule: Rule) {
        if (this.rules !== null) {
            this.rules.push(rule);
        } else {
            console.warn('failed to add rule because of syntax error');
        }
    }

    deleteRule(rule: Rule) {
        if (this.rules !== null) {
            const idx = this.rules.findIndex(e => e === rule);
            if (idx >= 0)
                this.rules.splice(idx, 1);
        } else {
            console.warn('failed to delete rule because of syntax error');
        }
    }

    /**
     * match any
     */
    match(target: BlockTarget): Rule | null {
        if (this.rules === null) {
            return null;
        }

        for (const rule of this.rules) {
            if (rule.match(target)) {
                return rule;
            }
        }
        return null;
    }

    private static loadString(text: string): [Rule[] | null, p.ParserOutput] {
        const timeStart = performance.now();
        const output = configParser.parseString(text);
        console.debug('parse %d ms', performance.now() - timeStart);

        if (!output.matched) {
            return [null, output];
        }

        const rules: Rule[] = [];

        for (const rule of (output.result.data)) {
            if (rule)
                rules.push(rule);
        }

        return [rules, output];
    }

    public static default(): Config {
        return new Config('');
    }
}
