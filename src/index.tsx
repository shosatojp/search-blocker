import React from "react";
import { createRoot } from 'react-dom/client';
import { MainControl } from './components/MainControl';
import { ConfigProvider } from './providers/ConfigProvider';
import { detectPlatform } from './platform';
import { TamperMonkeyConfigLoader } from "./configLoader";
import { BlockTarget, SiteSetting } from "./blockers/blocker";
import { GoogleSiteSetting } from "./blockers/google";
import { BingSiteSetting } from "./blockers/bing";
import { YahooComSiteSetting } from "./blockers/yahoo.com";
import { YahooCoJpComSiteSetting } from "./blockers/yahoo.co.jp";
import { Config } from "./config";

console.debug('===========Load Started============');

const configLoader = (() => {
    const platform = detectPlatform();
    switch (platform) {
        case 'tampermonkey':
            return new TamperMonkeyConfigLoader();
    }
})();

const SITE_SETTINGS = [
    new GoogleSiteSetting(),
    new BingSiteSetting(),
    new YahooComSiteSetting(),
    new YahooCoJpComSiteSetting(),
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

    siteSetting.observeMutate((blockTarget: BlockTarget) => {
        blockTarget.hide(Boolean(config.match(blockTarget)));
        earlyBlockTargets.push(blockTarget);
    });

    document.addEventListener('DOMContentLoaded', () => {
        console.debug('===========DOMContentLoaded============');

        /**
         * render main UI
         */
        const container = siteSetting.createRootContainer();
        const root = createRoot(container);
        root.render(
            <>
                <ConfigProvider
                    configLoader={configLoader}
                    config={config ?? undefined}
                >
                    <MainControl
                        siteSetting={siteSetting}
                        earlyBlockTargets={earlyBlockTargets} />
                </ConfigProvider>
            </>
        );
    });

})();
