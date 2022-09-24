export const charsLowerCase = 'abcdefghijklmnopqrstuvwxyz';
export const charsUpperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const charsNumber = '0123456789';
export const charsSymbol = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
export const charsWhite = ' \t\n\r\x0b\x0c';
export const charsAlpha = charsLowerCase + charsUpperCase;
export const charsAlphaNum = charsAlpha + charsNumber;
export const charsNotWhite = charsAlphaNum + charsSymbol;
export const charsPrintable = charsNotWhite + charsWhite;

export function charsExclude(base: string, exclude: string): string {
    const baseSet = new Set(base);
    const excludeSet = new Set(exclude);
    for (const exclude of excludeSet) {
        if (baseSet.has(exclude))
            baseSet.delete(exclude);
    }
    return Array.from(baseSet.values()).join('');
}

export type ParserType =
    'named' |
    'anyChar' |
    'char' |
    'eof' |
    'combine' |
    'or' |
    'word' |
    'anyWord' |
    'optional' |
    'oneOrMore' |
    'zeroOrMore' |
    'white' |
    'delimited' |
    'quoted' |
    'repeat';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MatchResultOptions<T = any> = {
    name?: string
    str: string
    // eslint-disable-next-line no-use-before-define
    children: MatchResult[]
    supress?: boolean
    data?: T
} & ({
    type: 'repeat'
    count: number
} | {
    type: Exclude<ParserType, 'repeat'>
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class MatchResult<T = any> {
    name?: string;
    str: string;
    // eslint-disable-next-line no-use-before-define
    children: MatchResult[];
    supress?: boolean;
    data?: T;
    type: ParserType;
    count: number | null;

    constructor(options: MatchResultOptions) {
        this.name = options.name;
        this.str = options.str;
        this.children = options.children;
        this.supress = options.supress;
        this.data = options.data;
        this.type = options.type;
        this.count = 'count' in options ? options.count : null;
    }

    getName(name: string): MatchResult | null {
        if (this.name === name) {
            return this;
        }

        for (const child of this.children) {
            const r: MatchResult | null = child.getName(name);
            if (r) {
                return r;
            }
        }

        return null;
    }

    getNameAll(name: string): MatchResult[] {
        const ret = [];

        if (this.name === name) {
            ret.push(this);
        }

        for (const child of this.children) {
            const rs: MatchResult[] = child.getNameAll(name);
            for (const r of rs) {
                ret.push(r);
            }
        }

        return ret;
    }

    extend(options: Partial<MatchResultOptions<T>>): MatchResult {
        return new MatchResult({ ...this, ...options });
    }
}

export type ParserInput = string;

export type ParserOutput = {
    name?: string
} & ({
    matched: false
} | {
    matched: true
    result: MatchResult
    rest: string
});

export type ParserOptions = {
    consume: boolean
};

export type MapFunction<T> = (result: MatchResult<T>) => T;

export abstract class Parser {
    public abstract parse(input: ParserInput): ParserOutput;
    public map<T>(fn: MapFunction<T>): MapParser<T> {
        return new MapParser(this, fn);
    }

    public named(name: string): NamedParser {
        return new NamedParser(this, name);
    }

    public typed(type: ParserType): TypedParser {
        return new TypedParser(this, type);
    }

    public optional(): OptionalParser {
        return new OptionalParser(this);
    }

    public zeroOrMore(): ZeroOrMoreParser {
        return new ZeroOrMoreParser(this);
    }

    public oneOrMore(): OneOrMoreParser {
        return new OneOrMoreParser(this);
    }

    public flatten(): FlattenParser {
        return new FlattenParser(this);
    }

    public supress(): SupressParser {
        return new SupressParser(this);
    }

    public noConsume(): NoConsumeParser {
        return new NoConsumeParser(this);
    }
}

class MapParser<T> extends Parser {
    parser: Parser;
    fn: MapFunction<T>;

    constructor(parser: Parser, fn: MapFunction<T>) {
        super();
        this.parser = parser;
        this.fn = fn;
    }

    public parse(input: ParserInput): ParserOutput {
        const output = this.parser.parse(input);
        if (output.matched) {
            output.result.data = this.fn(output.result);
            return output;
        } else {
            return { matched: false };
        }
    }
}

abstract class SimpleParser extends Parser {
    parser: Parser;
    constructor(parser: Parser) {
        super();
        this.parser = parser;
    }

    public parse(input: ParserInput): ParserOutput {
        return this.parser.parse(input);
    }
}

class NamedParser extends Parser {
    parser: Parser;
    name: string;

    constructor(parser: Parser, name: string) {
        super();
        this.parser = parser;
        this.name = name;
    }

    public parse(input: ParserInput): ParserOutput {
        const output = this.parser.parse(input);
        if (output.matched) {
            output.result.name = this.name;
        }
        output.name = this.name;
        return output;
    }
}

class TypedParser extends Parser {
    parser: Parser;
    type: ParserType;

    constructor(parser: Parser, type: ParserType) {
        super();
        this.parser = parser;
        this.type = type;
    }

    public parse(input: ParserInput): ParserOutput {
        const output = this.parser.parse(input);
        if (output.matched) {
            output.result.type = this.type;
        }
        return output;
    }
}

export class AnyCharParser extends Parser {
    chars: string;

    constructor(chars: string = charsPrintable) {
        super();
        this.chars = chars;
    }

    public parse(input: ParserInput): ParserOutput {
        if (input.length > 0 && this.chars.includes(input[0])) {
            const char = input[0];
            const rest = input.slice(1);
            return {
                matched: true,
                result: new MatchResult({ type: 'anyChar', str: char, children: [], data: char }),
                rest,
            };
        } else {
            return { matched: false };
        }
    }
}

export class SupressParser extends Parser {
    parser: Parser;

    constructor(parser: Parser) {
        super();
        this.parser = parser;
    }

    public parse(input: ParserInput): ParserOutput {
        const output = this.parser.parse(input);
        if (output.matched) {
            return {
                ...output,
                result: output.result.extend({ supress: true }),
            };
        } else {
            return output;
        }
    }
}

export class NoConsumeParser extends Parser {
    parser: Parser;

    constructor(parser: Parser) {
        super();
        this.parser = parser;
    }

    public parse(input: ParserInput): ParserOutput {
        const output = this.parser.parse(input);
        if (output.matched) {
            return {
                ...output,
                result: output.result.extend({ str: '' }),
                rest: input, /* no consume */
            };
        } else {
            return output;
        }
    }
}
export const noConsume = (parser: Parser) => new NoConsumeParser(parser);

export class FlattenParser extends Parser {
    parser: Parser;

    constructor(parser: Parser) {
        super();
        this.parser = parser;
    }

    public parse(input: ParserInput): ParserOutput {
        const output = this.parser.parse(input);
        if (output.matched) {
            return {
                ...output,
                result: output.result.extend({ children: [] }),
            };
        } else {
            return output;
        }
    }
}

export class CharParser extends Parser {
    parser: Parser;
    char: string;

    constructor(char: string) {
        super();
        if (char.length !== 1) {
            throw new Error('');
        }
        this.char = char;
        this.parser = new AnyCharParser();
    }

    public parse(input: ParserInput): ParserOutput {
        const output = this.parser.parse(input);
        if (output.matched && output.result.str === this.char) {
            return {
                ...output,
                result: output.result.extend({ type: 'char' }),
            };
        } else {
            return { matched: false };
        }
    }
}
export const char = (char: string) => new CharParser(char);

export class EOFParser extends Parser {
    public parse(input: ParserInput): ParserOutput {
        if (input.length === 0) {
            return {
                matched: true,
                result: new MatchResult({ type: 'eof', str: '', children: [], data: null }),
                rest: '',
            };
        } else {
            return { matched: false };
        }
    }
}
export const eof = () => new EOFParser();

export type CombineParserOptions = {
    concat?: boolean
};

export class CombineParser extends Parser {
    parsers: Parser[];
    options?: CombineParserOptions;

    constructor(parsers: Parser[], options?: CombineParserOptions) {
        super();
        this.parsers = parsers;
        this.options = options;
    }

    public parse(input: ParserInput): ParserOutput {
        const children = [];
        let rest = input;
        for (const parser of this.parsers) {
            const output = parser.parse(rest);
            if (output.matched) {
                rest = output.rest;
                if (!output.result.supress)
                    children.push(output.result);
                continue;
            } else {
                return { matched: false };
            }
        }
        return {
            matched: true,
            rest,
            result: new MatchResult({
                type: 'combine',
                str: children.map(e => e.str).join(''),
                children: this.options?.concat ? [] : children,
                data: children.map(e => e.data),
            }),
        };
    }
}
export const combine = (...parsers: Parser[]) => new CombineParser(parsers);

export class OrParser extends Parser {
    parsers: Parser[];

    constructor(parsers: Parser[]) {
        super();
        this.parsers = parsers;
    }

    public parse(input: ParserInput): ParserOutput {
        let longestLength = -1;
        let longestOutput: ParserOutput | null = null;

        for (const parser of this.parsers) {
            const output = parser.parse(input);
            if (output.matched) {
                if (output.result.str.length > longestLength) {
                    longestLength = output.result.str.length;
                    longestOutput = output;
                }
            }
        }

        if (longestOutput) {
            return {
                ...longestOutput,
                result: new MatchResult({
                    type: 'or',
                    str: longestOutput.result.str,
                    children: [longestOutput.result],
                    data: longestOutput.result.data,
                }),
            };
        } else {
            return { matched: false };
        }
    }
}
export const or = (...parsers: Parser[]) => new OrParser(parsers);

export type RepeatParserOptions = {
    flatten?: boolean
} & ({
    type: '?' | '*' | '+',
} | Partial<{
    min: number,
    max: number,
}>);

export class RepeatParser extends Parser {
    parser: Parser;
    options: RepeatParserOptions;

    constructor(parser: Parser, options?: RepeatParserOptions) {
        super();
        this.parser = parser;
        this.options = options || {};
    }

    public parse(input: ParserInput): ParserOutput {
        const children = [];
        let count = 0;
        let rest = input;
        while (true) {
            const output = this.parser.parse(rest);

            if (!output.matched)
                break;

            count++;
            rest = output.rest;
            if (!output.result.supress)
                children.push(output.result);

            /* break if rest is empty */
            if (rest.length === 0) {
                break;
            }

            /* break if max bounded */
            if (
                ('type' in this.options && this.options.type === '?' && count >= 1) ||
                ('max' in this.options && typeof this.options.max === 'number' &&
                    count >= this.options.max)
            )
                break;
        }

        const matched =
            ('type' in this.options && this.options.type === '?' && count <= 1) ||
            ('type' in this.options && this.options.type === '*') ||
            ('type' in this.options && this.options.type === '+' && count > 0) ||
            ('min' in this.options && typeof this.options.min === 'number' &&
                !('max' in this.options) &&
                this.options.min <= count) ||
            (!('min' in this.options) &&
                'max' in this.options && typeof this.options.max === 'number' &&
                count < this.options.max) ||
            ('min' in this.options && typeof this.options.min === 'number' &&
                'max' in this.options && typeof this.options.max === 'number' &&
                this.options.min <= count && count < this.options.max)
            ;

        if (matched) {
            return {
                matched: true,
                result: new MatchResult({
                    type: 'repeat',
                    str: children.map(e => e.str).join(''),
                    children: this.options.flatten ? [] : children,
                    count,
                    data: children.map(e => e.data),
                }),
                rest,
            };
        } else {
            return { matched: false };
        }
    }
}

export type DelimitedParserOptions = {
    empty?: boolean
};

export class DelimitedParser extends Parser {
    parser: Parser;
    empty: boolean;

    constructor(fragment: Parser, delimiter: Parser, empty: boolean) {
        super();
        this.empty = empty;
        this.parser = combine(
            fragment,
            zeroOrMore(combine(delimiter, fragment))
        ).optional();
    }

    public parse(input: ParserInput): ParserOutput {
        const output = this.parser.parse(input);
        if (output.matched) {
            const children = output.result.children.length > 0
                ? [
                    output.result.children[0].children[0],
                    ...output.result.children[0].children[1].children.map(e => e.children[1]),
                ]
                : [];

            if (!this.empty && children.length === 0) {
                return { matched: false };
            }

            return {
                matched: true,
                result: new MatchResult({
                    type: 'delimited',
                    str: output.result.str,
                    children,
                    data: children.map(r => r.data),
                }),
                rest: output.rest,
            };
        } else {
            return { matched: false };
        }
    }
}
export const delimited = (fragment: Parser, delimiter: Parser, empty = false) =>
    new DelimitedParser(fragment, delimiter, empty);

export class LiteralParser extends SimpleParser {
    constructor(word: string) {
        const parsers = word.split('').map(e => new CharParser(e));
        const parser = new TypedParser(new CombineParser(parsers, { concat: true }), 'word');
        super(parser);
    }
}
export const literal = (word: string) => new LiteralParser(word);

export class OptionalParser extends SimpleParser {
    constructor(_parser: Parser) {
        const parser = new TypedParser(new RepeatParser(_parser, { type: '?' }), 'optional');
        super(parser);
    }
}
export const optional = (parser: Parser) => new OptionalParser(parser);

export class ZeroOrMoreParser extends SimpleParser {
    constructor(_parser: Parser) {
        const parser = new TypedParser(new RepeatParser(_parser, { type: '*' }), 'zeroOrMore');
        super(parser);
    }
}
export const zeroOrMore = (parser: Parser) => new ZeroOrMoreParser(parser);

export class OneOrMoreParser extends SimpleParser {
    constructor(_parser: Parser) {
        const parser = new TypedParser(new RepeatParser(_parser, { type: '+' }), 'oneOrMore');
        super(parser);
    }
}
export const oneOrMore = (parser: Parser) => new OneOrMoreParser(parser);

export class WordParser extends SimpleParser {
    constructor(chars: string = charsAlphaNum) {
        const parser = new TypedParser(new RepeatParser(new AnyCharParser(chars), { type: '+', flatten: true }), 'anyWord');
        super(parser.map(r => {
            if (r.data instanceof Array) {
                return r.data.join('');
            } else {
                return r.data;
            }
        }));
    }
}
export const word = (chars: string = charsAlphaNum) => new WordParser(chars);

export class WhiteParser extends SimpleParser {
    constructor(chars: string = charsWhite) {
        const parser = new TypedParser(new RepeatParser(new AnyCharParser(chars), { type: '*', flatten: true }), 'white');
        super(parser);
    }
}
export const white = (chars: string = charsWhite) => new WhiteParser(chars);

export class ForwardParser extends Parser {
    parser: Parser | null = null;

    public set(parser: Parser) {
        this.parser = parser;
    }

    public parse(input: string): ParserOutput {
        if (!this.parser) {
            throw new Error('parser is not set yet');
        }

        return this.parser.parse(input);
    }
}
export const forward = () => new ForwardParser();

export class QuotedParser extends Parser {
    quote: Parser;
    escape: Parser;
    escapeMap: Map<string, string>;

    constructor(quote: string, escape: string, escapeMap: Map<string, string>) {
        super();
        this.quote = char(quote);
        this.escape = char(escape);
        this.escapeMap = escapeMap;
    }

    public parse(input: string): ParserOutput {
        const chars: string[] = [];
        const quoteStart = this.quote.parse(input);
        if (!quoteStart.matched)
            return { matched: false };

        for (let i = 0, c = quoteStart.rest[0], rest = quoteStart.rest;
            i < quoteStart.rest.length;
            i++, c = quoteStart.rest[i], rest = quoteStart.rest.slice(i)) {
            const esc = this.escape.parse(rest);
            if (esc.matched) {
                const escaped = this.escapeMap.get(rest[1]);
                if (escaped) {
                    chars.push(escaped); /* escaped char */
                    i++; /* skip escaped char */
                    continue;
                }
            }

            const quoteEnd = this.quote.parse(rest);
            if (quoteEnd.matched) {
                const str = chars.join('');
                return {
                    matched: true,
                    rest: quoteEnd.rest,
                    result: new MatchResult({
                        type: 'quoted',
                        children: [],
                        str,
                        data: str,
                    }),
                };
            }

            chars.push(c);
        }

        return { matched: false };
    }
}
export const quoted = (quote: string, escape: string, escapeMap: Map<string, string>) =>
    new QuotedParser(quote, escape, escapeMap);
