import { test, expect } from '@jest/globals';
import * as p from './parser';

test('anyChar', () => {
    expect(new p.AnyCharParser().parseString('ab').matched).toBe(true);
    expect(new p.AnyCharParser().parseString('a').matched).toBe(true);
    expect(new p.AnyCharParser().parseString('').matched).toBe(false);
});

test('char', () => {
    expect(p.char('a').parseString('a').matched).toBe(true);
    expect(p.char('a').parseString('b').matched).toBe(false);
    expect(p.char('a').parseString('').matched).toBe(false);
});

test('eof', () => {
    expect(p.eof().parseString('').matched).toBe(true);
    expect(p.eof().parseString('a').matched).toBe(false);
});

test('combine', () => {
    expect(p.combine(p.char('a')).parseString('a').matched).toBe(true);
    expect(p.combine(p.char('a'), p.eof()).parseString('a').matched).toBe(true);
    expect(p.combine(p.char('a'), p.char('b')).parseString('ab').matched).toBe(true);
    expect(p.combine(p.char('a'), p.char('c')).parseString('ab').matched).toBe(false);
    expect(p.combine(p.char('c'), p.char('a')).parseString('ab').matched).toBe(false);
});

test('literal', () => {
    expect(p.literal('a').parseString('a').matched).toBe(true);
    expect(p.literal('ab').parseString('ab').matched).toBe(true);
    expect(p.literal('aa').parseString('ab').matched).toBe(false);
});

test('or', () => {
    expect(p.or(p.char('a'), p.char('b')).parseString('a').matched).toBe(true);
    expect(p.or(p.char('a'), p.char('b')).parseString('b').matched).toBe(true);
    expect(p.or(p.char('a'), p.char('b')).parseString('c').matched).toBe(false);
});

test('optional', () => {
    expect(p.optional(p.char('a')).parseString('a').matched).toBe(true);
    expect(p.optional(p.char('a')).parseString('b').matched).toBe(true);
    expect(p.optional(p.char('a')).parseString('').matched).toBe(true);
});

test('oneOrMore', () => {
    expect(p.oneOrMore(p.char('a')).parseString('').matched).toBe(false);
    expect(p.oneOrMore(p.char('a')).parseString('a').matched).toBe(true);
    expect(p.oneOrMore(p.char('a')).parseString('aa').matched).toBe(true);
});

test('zeroOrMore', () => {
    expect(p.zeroOrMore(p.char('a')).parseString('').matched).toBe(true);
    expect(p.zeroOrMore(p.char('a')).parseString('a').matched).toBe(true);
    expect(p.zeroOrMore(p.char('a')).parseString('aa').matched).toBe(true);
});

test('white', () => {
    expect(p.combine(p.white(), p.eof()).parseString('').matched).toBe(true);
    expect(p.combine(p.white(), p.eof()).parseString(' ').matched).toBe(true);
    expect(p.combine(p.white(), p.eof()).parseString('  ').matched).toBe(true);
    expect(p.combine(p.white(), p.eof()).parseString('a').matched).toBe(false);
});

test('word', () => {
    expect(p.word().parseString('aaa').matched).toBe(true);
    expect((() => {
        const output = p.word().parseString('aaa bbb');
        return output.matched && output.result.str === 'aaa';
    })()).toBe(true);
    expect(p.word().parseString('').matched).toBe(false);
});

test('mail', () => {
    const emailAddr = p.combine(
        p.word(p.charsAlphaNum + '.'),
        p.char('@'),
        p.word(p.charsAlphaNum + '.')
    ).named('emailaddr');

    const emailWithName = p.combine(
        p.word(),
        p.white(),
        p.combine(p.char('<'), emailAddr, p.char('>'))
    );

    const mailAddr = 'hoge@example.com';
    {
        const mailFromParser = p.combine(
            p.white(),
            p.or(emailWithName, emailAddr),
            p.white(),
            p.eof()
        );
        expect(mailFromParser.parseString(`example<${mailAddr}>`).matched).toBe(true);
        expect(mailFromParser.parseString(` example <${mailAddr}> `).matched).toBe(true);
        expect(mailFromParser.parseString(`${mailAddr}`).matched).toBe(true);
        expect(mailFromParser.parseString(` example ${mailAddr}> `).matched).toBe(false);
        expect((() => {
            const output = mailFromParser.parseString(`example <${mailAddr}>`);
            return output.matched && output.result.getName('emailaddr')?.str === mailAddr;
        })()).toBe(true);
    }
    {
        const mailFromParser = p.combine(
            p.white(),
            p.or(emailAddr, emailWithName),
            p.white(),
            p.eof()
        );
        expect(mailFromParser.parseString(`example<${mailAddr}>`).matched).toBe(true);
        expect(mailFromParser.parseString(` example <${mailAddr}> `).matched).toBe(true);
        expect(mailFromParser.parseString(`${mailAddr}`).matched).toBe(true);
        expect(mailFromParser.parseString(` example ${mailAddr}> `).matched).toBe(false);
        expect((() => {
            const output = mailFromParser.parseString(`example <${mailAddr}>`);
            return output.matched && output.result.getName('emailaddr')?.str === mailAddr;
        })()).toBe(true);
    }
});

test('noConsume', () => {
    expect(p.char('a').noConsume().parseString('a').matched).toBe(true);
    expect(p.char('a').noConsume().parseString('a').matched).toBe(true);
    expect(p.combine(p.char('a').noConsume(), p.char('a')).parseString('a').matched).toBe(true);
});

test('calc', () => {
    const Num =
        p.combine(p.optional(p.char('-')), p.word('0123456789'))
            .map(r => Number(r.str))
            .flatten();

    const OpMulDiv =
        p.or(
            p.char('*').map(() => (a: number, b: number) => a * b),
            p.char('/').map(() => (a: number, b: number) => a / b)
        ).flatten();
    const OpAddSub =
        p.or(
            p.char('+').map(() => (a: number, b: number) => a + b),
            p.char('-').map(() => (a: number, b: number) => a - b)
        ).flatten();
    const space = p.word(p.charsWhite).optional().supress();

    const Expr = p.forward();
    const Additive = p.forward();
    const Multitive = p.forward();
    const Primary = p.forward();

    Expr.set(Additive);
    Additive.set(
        p.or(
            Multitive,
            p.combine(Multitive, space, OpAddSub, space, Additive)
                .map(r => r.children[1].data(r.children[0].data, r.children[2].data))
        ).flatten()
    );
    Multitive.set(
        p.or(
            Primary,
            p.combine(Primary, space, OpMulDiv, space, Multitive)
                .map(r => r.children[1].data(r.children[0].data, r.children[2].data))
        ).flatten()
    );
    Primary.set(
        p.or(
            p.combine(p.char('('), space, Expr, space, p.char(')'))
                .map(r => r.children[1].data),
            Num
        ).flatten()
    );

    const Calc =
        p.combine(space, Expr, space, p.eof())
            .map(r => r.children[0].data)
            .flatten();

    const input = '(1 +2 ) * 3+  4 -5 *67';
    const output = Calc.parseString(input);
    if (output.matched) {
        // console.dir(output, { depth: null });
        // console.log('%s = %d', input, output.result.data);
        // console.log(output.rest);
    }

    // eslint-disable-next-line no-eval
    expect(output.matched && output.result.data).toBe(eval(input));
});

test('quoted', () => {
    const doubleQuoted = p.quoted('"', '\\', new Map([
        ['\\', '\\'],
        ['"', '"'],
        ['\n', '\n'],
    ]));
    expect(doubleQuoted.parseString('"hoge"').matched).toBe(true);
    expect(doubleQuoted.parseString('"ho\\"ge"').matched).toBe(true);
    expect(doubleQuoted.parseString('"hoge').matched).toBe(false);
    expect(doubleQuoted.parseString('hoge"').matched).toBe(false);
    expect(doubleQuoted.parseString('hoge').matched).toBe(false);
});

test('error pos', () => {
    expect(p.char('a').parseString('a').rest.pos).toBe(1);
    expect(p.char('a').parseString('b').rest.pos).toBe(0);
    expect(p.combine(p.char('a'), p.char('b')).parseString('').rest.pos).toBe(0);
    expect(p.combine(p.char('a'), p.char('b')).parseString('a').rest.pos).toBe(1);
    expect(p.combine(p.char('a'), p.char('b')).parseString('az').rest.pos).toBe(1);
    expect(p.combine(p.char('a'), p.char('b')).parseString('ab').rest.pos).toBe(2);
    expect(p.combine(p.char('a'), p.char('b'), p.char('c')).parseString('abz').rest.pos).toBe(2);
    expect(p.or(p.char('a'), p.char('b')).parseString('c').rest.pos).toBe(0);
    expect(p.combine(p.char('a'), p.or(p.char('b'), p.char('c'))).parseString('az').rest.pos).toBe(1);
});

test('error display', () => {
    expect(p.ParserOutput.display('ab', 0)).toBe('line 0: ab\n        ^');
    expect(p.ParserOutput.display('ab', 1)).toBe('line 0: ab\n         ^');
    expect(p.ParserOutput.display('ab\ncd', 3)).toBe('line 1: cd\n        ^');
    expect(p.ParserOutput.display('ab\ncd', 4)).toBe('line 1: cd\n         ^');
});
