import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MainControl } from './components/MainControl';
import { ConfigProvider } from './providers/ConfigProvider';
import { ChromeExtensionConfigLoader } from './config/chrome';
import { TamperMonkeyConfigLoader } from './config/tampermonkey';
import { BlockTarget, SiteSetting } from './blockers/blocker';
import { GoogleSiteSetting } from './blockers/google';
import { BingSiteSetting } from './blockers/bing';
import { YahooComSiteSetting } from './blockers/yahoo.com';
import { YahooCoJpComSiteSetting } from './blockers/yahoo.co.jp';
import { Config } from './config/config';
import { FirefoxExtensionConfigLoader } from './config/firefox';
import { DuckDuckGoSiteSetting } from './blockers/duckduckgo';

console.log('Search Blocker v' + process.env.VERSION);

console.debug('===========Load Started============');

const configLoader = (() => {
    const platform = process.env.PLATFORM;
    switch (platform) {
        case 'tampermonkey':
            return new TamperMonkeyConfigLoader();
        case 'chrome':
            return new ChromeExtensionConfigLoader();
        case 'firefox':
            return new FirefoxExtensionConfigLoader();
        default:
            throw new Error('Unsupported Platform');
    }
})();

const SITE_SETTINGS = [
    new GoogleSiteSetting(),
    new BingSiteSetting(),
    new YahooComSiteSetting(),
    new YahooCoJpComSiteSetting(),
    new DuckDuckGoSiteSetting(),
];

const siteSetting = (() => {
    const site = SITE_SETTINGS.find((setting: SiteSetting) => setting.match());
    if (!site) {
        throw new Error('Unsupported Site');
    }
    return site;
})();

(async () => {
    /**
     * early blocking (to prevent flicker)
     */
    const config = await configLoader.load(Config.default());
    const earlyBlockTargets: BlockTarget[] = [];

    siteSetting.observeMutate((blockTargets: BlockTarget[]) => {
        for (const blockTarget of blockTargets) {
            try {
                /**
                 * ignore targets which descendants are not constructed
                 */
                blockTarget.hide(Boolean(config.match(blockTarget)));
                earlyBlockTargets.push(blockTarget);
            } catch (error) {
                console.warn(error);
            }
        }
    });

    async function main() {
        /**
         * render main UI
         */
        const container = siteSetting.createRootContainer();
        const root = createRoot(container);
        root.render(
            <StrictMode>
                <ConfigProvider
                    configLoader={configLoader}
                    config={config ?? undefined}
                >
                    <MainControl
                        siteSetting={siteSetting}
                        earlyBlockTargets={earlyBlockTargets}
                        configLoader={configLoader} />
                </ConfigProvider>
            </StrictMode>
        );
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            console.debug('===========DOMContentLoaded============');
            await main();
        });
    } else {
        await main();
    }

})();
