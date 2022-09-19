import { Config } from './config';
import { ConfigLoader } from './configLoader';


// https://www.tampermonkey.net/documentation.php
declare function GM_setValue<T>(name: string, config: T): T;
declare function GM_getValue<T>(name: string, defaultConfig: T): T;

export class TamperMonkeyConfigLoader extends ConfigLoader {
    public async load(defaultConfig: Config): Promise<Config> {
        const config = GM_getValue('config', defaultConfig);
        return Config.loadObject(config);
    }

    public async save(config: Config): Promise<void> {
        GM_setValue('config', config);
    }

    public async setModifiedDate(modifiedDate: Date): Promise<void> {
        GM_setValue('modifiedDate', modifiedDate.toJSON());
    }

    public async getModifiedDate(): Promise<Date | null> {
        const dateString = GM_getValue('modifiedDate', null);
        return dateString ? new Date(dateString) : null;
    }
}
