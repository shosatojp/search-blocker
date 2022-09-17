import React from "react";
import { createRoot } from 'react-dom/client';
import { MainControl } from './components/MainControl';
import { ConfigProvider } from './providers/ConfigProvider';
import { detectPlatform } from './platform';
import { TamperMonkeyConfigLoader } from "./configLoader";
import { GoogleBlockTargetGenerator } from "./blockers/google";

function createRootContainer(): HTMLElement {
    const searchElement = document.querySelector('#search');
    const container = document.createElement('div');

    searchElement!.appendChild(container);

    return container;
}

const platform = detectPlatform();
const configLoader = (() => {
    switch (platform) {
        case 'tampermonkey':
            return new TamperMonkeyConfigLoader();
    }
})();
const targetGenerator = new GoogleBlockTargetGenerator();


document.addEventListener('DOMContentLoaded', () => {
    const container = createRootContainer();
    const root = createRoot(container!);
    root.render(
        <>
            <ConfigProvider configLoader={configLoader}>
                <MainControl targetGenerator={targetGenerator} />
            </ConfigProvider>
        </>
    );
});
