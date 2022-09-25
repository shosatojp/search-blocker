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

    update(options: Partial<MatchResultOptions<T>>): MatchResult {
        return new MatchResult({ ...this, ...options });
    }
}

export class ParserInput {
    private readonly _text: string;
    private readonly _pos: number;

    constructor(text: string, pos = 0) {
        this._text = text;
        this._pos = pos;
    }

    public get pos(): number {
        return this._pos;
    }

    public get text(): string {
        return this._text.slice(this._pos);
    }

    public get source(): string {
        return this._text;
    }

    consumed(n: number): ParserInput {
        return new ParserInput(this._text, this._pos + n);
    }
}

export type ParserOutputOptions = {
    name?: string
    rest: ParserInput
    result: MatchResult
    matched: boolean
};

export class ParserOutput {
    readonly name?: string;
    readonly rest: ParserInput;
    readonly result: MatchResult;
    readonly matched: boolean;

    constructor(options: ParserOutputOptions) {
        this.matched = options.matched;
        this.result = options.result;
        this.rest = options.rest;
        this.name = options.name;
    }

    public display(): string {
        return ParserOutput.display(this.rest.source, this.rest.pos);
    }

    public static display(text: string, pos: number): string {
        let row = 0;
        let col = 0;
        let colStartPos = 0;
        for (let i = 0; i < pos; i++) {
            if (text[i] === '\n') {
                row++;
                col = 0;
                colStartPos = i + 1;
            } else {
                col++;
            }
        }

        const colEndPos = text.indexOf('\n', colStartPos);
        const prefix = `line ${row}: `;
        return (
            prefix + text.slice(colStartPos, colEndPos === -1 ? text.length : colEndPos) + '\n' +
            ' '.repeat(prefix.length + col) + '^'
        );
    }
}

export type ParserOptions = {
    consume: boolean
};

export type MapFunction<T> = (result: MatchResult<T>) => T;

export abstract class Parser {
    public abstract parse(input: ParserInput): ParserOutput;
    public parseString(text: string): ParserOutput {
        return this.parse(new ParserInput(text, 0));
    }

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
        }
        return output;
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
        return new ParserOutput({ ...output, name: this.name });
    }
}

class TypedParser extends Parser {
    readonly parser: Parser;
    readonly type: ParserType;

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
        const text = input.text;
        if (text.length > 0 && this.chars.includes(text[0])) {
            const char = text[0];
            return new ParserOutput({
                matched: true,
                result: new MatchResult({ type: 'anyChar', str: char, children: [], data: char }),
                rest: input.consumed(1),
            });
        } else {
            return new ParserOutput({
                matched: false,
                result: new MatchResult({ type: 'anyChar', str: '', children: [], data: null }),
                rest: input.consumed(0),
            });
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
            return new ParserOutput({
                ...output,
                result: output.result.update({ supress: true }),
            });
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
            return new ParserOutput({
                ...output,
                result: output.result.update({ str: '' }),
                rest: input.consumed(0), /* no consume */
            });
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
            return new ParserOutput({
                ...output,
                result: output.result.update({ children: [] }),
            });
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
            return new ParserOutput({
                ...output,
                result: output.result.update({ type: 'char' }),
            });
        } else {
            return new ParserOutput({
                matched: false,
                rest: input.consumed(0),
                result: output.result.update({ type: 'char' }),
            });
        }
    }
}
export const char = (char: string) => new CharParser(char);

export class EOFParser extends Parser {
    public parse(input: ParserInput): ParserOutput {
        if (input.text.length === 0) {
            return new ParserOutput({
                matched: true,
                result: new MatchResult({ type: 'eof', str: '', children: [], data: null }),
                rest: input.consumed(0),
            });
        } else {
            return new ParserOutput({
                matched: false,
                rest: input.consumed(0),
                result: new MatchResult({ type: 'eof', str: '', children: [], data: null }),
            });
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
            rest = output.rest;
            if (output.matched) {
                if (!output.result.supress)
                    children.push(output.result);
                continue;
            } else {
                return new ParserOutput({
                    matched: false,
                    rest: rest.consumed(0),
                    result: new MatchResult({
                        type: 'combine',
                        str: children.map(e => e.str).join(''),
                        children,
                    }),
                });
            }
        }
        return new ParserOutput({
            matched: true,
            rest: rest.consumed(0),
            result: new MatchResult({
                type: 'combine',
                str: children.map(e => e.str).join(''),
                children: this.options?.concat ? [] : children,
                data: children.map(e => e.data),
            }),
        });
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
        const rests: ParserInput[] = [input];

        for (const parser of this.parsers) {
            const output = parser.parse(input);
            rests.push(output.rest);
            if (output.matched) {
                if (output.result.str.length > longestLength) {
                    longestLength = output.result.str.length;
                    longestOutput = output;
                }
            }
        }

        if (longestOutput) {
            return new ParserOutput({
                ...longestOutput,
                result: new MatchResult({
                    type: 'or',
                    str: longestOutput.result.str,
                    children: [longestOutput.result],
                    data: longestOutput.result.data,
                }),
            });
        } else {
            let longestRest = rests[0];
            for (const rest of rests.slice(1)) {
                if (rest.pos > longestRest.pos)
                    longestRest = rest;
            }
            return new ParserOutput({
                matched: false,
                rest: longestRest.consumed(0),
                result: new MatchResult({ type: 'or', str: '', children: [], data: null }),
            });
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
        let output: ParserOutput;

        while (true) {
            output = this.parser.parse(rest);

            if (!output.matched)
                break;

            count++;
            rest = output.rest;
            if (!output.result.supress)
                children.push(output.result);

            /* break if rest is empty */
            if (output.rest.text.length === 0) {
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
            /* matched or completely not matched */
            (output.matched || output.rest.pos === rest.pos) &&
            /* check matched count */
            (
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
            );

        if (matched) {
            return new ParserOutput({
                matched: true,
                result: new MatchResult({
                    type: 'repeat',
                    str: children.map(e => e.str).join(''),
                    children: this.options.flatten ? [] : children,
                    count,
                    data: children.map(e => e.data),
                }),
                rest: rest.consumed(0),
            });
        } else {
            return new ParserOutput({
                matched: false,
                rest: output.rest.consumed(0),
                result: new MatchResult({ type: 'repeat', str: '', children: [], count }),
            });
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
                return new ParserOutput({
                    matched: false,
                    rest: output.rest.consumed(0),
                    result: new MatchResult({ type: 'delimited', str: '', children: [], data: null }),
                });
            }

            return new ParserOutput({
                matched: true,
                result: new MatchResult({
                    type: 'delimited',
                    str: output.result.str,
                    children,
                    data: children.map(r => r.data),
                }),
                rest: output.rest.consumed(0),
            });
        } else {
            return new ParserOutput({
                matched: false,
                rest: output.rest.consumed(0),
                result: new MatchResult({ type: 'delimited', str: '', children: [], data: null }),
            });
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

    public parse(input: ParserInput): ParserOutput {
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

    public parse(input: ParserInput): ParserOutput {
        const chars: string[] = [];
        const quoteStart = this.quote.parse(input);
        if (!quoteStart.matched)
            return new ParserOutput({
                matched: false,
                rest: input.consumed(0),
                result: new MatchResult({ type: 'quoted', str: '', children: [] }),
            });

        for (let i = 0; i < quoteStart.rest.text.length; i++) {
            const rest = input.consumed(1 + i);
            const c = rest.text[0];

            const esc = this.escape.parse(rest);
            if (esc.matched) {
                const escaped = this.escapeMap.get(esc.rest.text[0]);
                if (escaped) {
                    chars.push(escaped); /* escaped char */
                    i++; /* skip escaped char */
                    continue;
                }
            }

            const quoteEnd = this.quote.parse(rest);
            if (quoteEnd.matched) {
                const str = chars.join('');
                return new ParserOutput({
                    matched: true,
                    rest: quoteEnd.rest.consumed(0),
                    result: new MatchResult({
                        type: 'quoted',
                        children: [],
                        str,
                        data: str,
                    }),
                });
            }

            chars.push(c);
        }

        return new ParserOutput({
            matched: false,
            rest: input.consumed(chars.length),
            result: new MatchResult({ type: 'quoted', str: '', children: [] }),
        });
    }
}
export const quoted = (quote: string, escape: string, escapeMap: Map<string, string>) =>
    new QuotedParser(quote, escape, escapeMap);
