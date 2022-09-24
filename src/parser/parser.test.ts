import { test, expect } from '@jest/globals';
import * as p from './parser';

test('anyChar', () => {
    expect(new p.AnyCharParser().parse('ab').matched).toBe(true);
    expect(new p.AnyCharParser().parse('a').matched).toBe(true);
    expect(new p.AnyCharParser().parse('').matched).toBe(false);
});

test('char', () => {
    expect(p.char('a').parse('a').matched).toBe(true);
    expect(p.char('a').parse('b').matched).toBe(false);
    expect(p.char('a').parse('').matched).toBe(false);
});

test('eof', () => {
    expect(p.eof().parse('').matched).toBe(true);
    expect(p.eof().parse('a').matched).toBe(false);
});

test('combine', () => {
    expect(p.combine(p.char('a')).parse('a').matched).toBe(true);
    expect(p.combine(p.char('a'), p.eof()).parse('a').matched).toBe(true);
    expect(p.combine(p.char('a'), p.char('b')).parse('ab').matched).toBe(true);
    expect(p.combine(p.char('a'), p.char('c')).parse('ab').matched).toBe(false);
    expect(p.combine(p.char('c'), p.char('a')).parse('ab').matched).toBe(false);
});

test('literal', () => {
    expect(p.literal('a').parse('a').matched).toBe(true);
    expect(p.literal('ab').parse('ab').matched).toBe(true);
    expect(p.literal('aa').parse('ab').matched).toBe(false);
});

test('or', () => {
    expect(p.or(p.char('a'), p.char('b')).parse('a').matched).toBe(true);
    expect(p.or(p.char('a'), p.char('b')).parse('b').matched).toBe(true);
    expect(p.or(p.char('a'), p.char('b')).parse('c').matched).toBe(false);
});

test('optional', () => {
    expect(p.optional(p.char('a')).parse('a').matched).toBe(true);
    expect(p.optional(p.char('a')).parse('b').matched).toBe(true);
    expect(p.optional(p.char('a')).parse('').matched).toBe(true);
});

test('oneOrMore', () => {
    expect(p.oneOrMore(p.char('a')).parse('').matched).toBe(false);
    expect(p.oneOrMore(p.char('a')).parse('a').matched).toBe(true);
    expect(p.oneOrMore(p.char('a')).parse('aa').matched).toBe(true);
});

test('zeroOrMore', () => {
    expect(p.zeroOrMore(p.char('a')).parse('').matched).toBe(true);
    expect(p.zeroOrMore(p.char('a')).parse('a').matched).toBe(true);
    expect(p.zeroOrMore(p.char('a')).parse('aa').matched).toBe(true);
});

test('white', () => {
    expect(p.combine(p.white(), p.eof()).parse('').matched).toBe(true);
    expect(p.combine(p.white(), p.eof()).parse(' ').matched).toBe(true);
    expect(p.combine(p.white(), p.eof()).parse('  ').matched).toBe(true);
    expect(p.combine(p.white(), p.eof()).parse('a').matched).toBe(false);
});

test('word', () => {
    expect(p.word().parse('aaa').matched).toBe(true);
    expect((() => {
        const output = p.word().parse('aaa bbb');
        return output.matched && output.result.str === 'aaa';
    })()).toBe(true);
    expect(p.word().parse('').matched).toBe(false);
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
        expect(mailFromParser.parse(`example<${mailAddr}>`).matched).toBe(true);
        expect(mailFromParser.parse(` example <${mailAddr}> `).matched).toBe(true);
        expect(mailFromParser.parse(`${mailAddr}`).matched).toBe(true);
        expect(mailFromParser.parse(` example ${mailAddr}> `).matched).toBe(false);
        expect((() => {
            const output = mailFromParser.parse(`example <${mailAddr}>`);
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
        expect(mailFromParser.parse(`example<${mailAddr}>`).matched).toBe(true);
        expect(mailFromParser.parse(` example <${mailAddr}> `).matched).toBe(true);
        expect(mailFromParser.parse(`${mailAddr}`).matched).toBe(true);
        expect(mailFromParser.parse(` example ${mailAddr}> `).matched).toBe(false);
        expect((() => {
            const output = mailFromParser.parse(`example <${mailAddr}>`);
            return output.matched && output.result.getName('emailaddr')?.str === mailAddr;
        })()).toBe(true);
    }
});

test('noConsume', () => {
    expect(p.char('a').noConsume().parse('a').matched).toBe(true);
    expect(p.char('a').noConsume().parse('a').matched).toBe(true);
    expect(p.combine(p.char('a').noConsume(), p.char('a')).parse('a').matched).toBe(true);
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
        ).map(r => r.children[0].data).flatten();
    const OpAddSub =
        p.or(
            p.char('+').map(() => (a: number, b: number) => a + b),
            p.char('-').map(() => (a: number, b: number) => a - b)
        ).map(r => r.children[0].data).flatten();
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
    const output = Calc.parse(input);
    if (output.matched) {
        // console.dir(output, { depth: null });
        // console.log('%s = %d', input, output.result.data);
        // console.log(output.rest);
    }

    // eslint-disable-next-line no-eval
    expect(output.matched && output.result.data).toBe(eval(input));
});
