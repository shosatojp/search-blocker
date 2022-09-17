import { Config } from './config';

export abstract class ConfigLoader {
    constructor() { }

    public abstract load(defaultConfig: Config): Promise<Config>;
    public abstract save(config: Config): Promise<void>;
}

// https://www.tampermonkey.net/documentation.php
declare function GM_setValue(name: string, config: Config): Config;
declare function GM_getValue(name: string, defaultConfig: Config): Config;

export class TamperMonkeyConfigLoader extends ConfigLoader {
    public async load(defaultConfig: Config): Promise<Config> {
        let config = GM_getValue('config', defaultConfig);
        return Config.loadObject(config);
    }
    public async save(config: Config): Promise<void> {
        GM_setValue('config', config);
    }
}
