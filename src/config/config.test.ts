/* eslint-disable no-lone-blocks */
import { test, expect } from '@jest/globals';
import { configParser } from './config';

test('config', () => {
    { /* hostname rule */
        const configText = 'example.com';
        expect(configParser.parseString(configText).matched).toBe(true);
    }
    { /* hostname rule with path */
        const configText = 'example.com/a/b/c';
        expect(configParser.parseString(configText).matched).toBe(true);
    }
    { /* regexp rule */
        const configText = '/example\\.com/';
        expect(configParser.parseString(configText).matched).toBe(true);
    }
    { /* function rule */
        const configText = '$intitle("ho\\"ge")';
        expect(configParser.parseString(configText).matched).toBe(true);
    }
    { /* empty rule */
        const configText = '';
        expect(configParser.parseString(configText).matched).toBe(true);
    }
    { /* comment rule */
        const configText = '#hogehoge';
        expect(configParser.parseString(configText).matched).toBe(true);
    }
    { /* multiline */
        const configText = '#hogehoge\nexample.com\n\n/example\\.com\n/';
        expect(configParser.parseString(configText).matched).toBe(true);
    }
});
