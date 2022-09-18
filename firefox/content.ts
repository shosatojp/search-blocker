import { FirefoxExtensionMessageContent } from '../src/config/firefox';
import { Config } from '../src/config/config';
import { Messenger } from '../src/messenger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const browser: any;

/**
 * inject
 */
const s = document.createElement('script');
s.src = browser.runtime.getURL('search-blocker.js');
s.onload = () => s.remove();
(document.head || document.documentElement).appendChild(s);


/**
 * message
 */
interface FirefoxStorageLocal {
    config: Config
}

new Messenger(process.env.REPOSITORY_URL as string, 'content.js', (message: FirefoxExtensionMessageContent) => {
    return new Promise((resolve, reject) => {
        switch (message.type) {
            case 'save':
                browser.storage.local.set({ config: message.config }, () => resolve(true));
                break;
            case 'load':
                browser.storage.local.get(['config'], (result: FirefoxStorageLocal) => resolve(result.config));
                break;
            default:
                reject('unsupported type');
                break;
        }
    });
});
