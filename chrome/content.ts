import { Messenger } from '../src/messenger';
import { ChromeExtensionMessageType } from '../src/config/chrome';

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
const messenger = new Messenger(process.env.REPOSITORY_URL as string, 'content.js', (message: any) => {
    return new Promise((resolve, reject) => {
        switch (message.type) {
            case 'save':
                const config = message.config;
                chrome.storage.local.set({ config }, () => resolve(true));
                break;
            case 'load':
                chrome.storage.local.get(['config'], (result: any) => resolve(result['config']));
                break;
            default:
                reject('unsupported type');
                break;
        }
    });
});
