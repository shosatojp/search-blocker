import { ChromeExtensionMessageContent } from '../../src/config/chrome';
import { Config } from '../../src/config/config';
import { Messenger } from '../../src/messenger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const chrome: any;

/**
 * inject
 */
const s = document.createElement('script');
s.src = chrome.runtime.getURL('search-blocker.js');
s.onload = () => s.remove();
(document.head || document.documentElement).appendChild(s);


/**
 * message
 */
interface ChromeStorageLocal {
    config: Config
}

new Messenger(process.env.REPOSITORY_URL as string, 'content.js', (message: ChromeExtensionMessageContent) => {
    return new Promise((resolve, reject) => {
        switch (message.type) {
            case 'save':
                chrome.storage.local.set({ config: message.config }, () => resolve(true));
                break;
            case 'load':
                chrome.storage.local.get(['config'], (result: ChromeStorageLocal) => resolve(result.config));
                break;
            default:
                reject('unsupported type');
                break;
        }
    });
});
