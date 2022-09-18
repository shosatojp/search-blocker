import { Config } from './config';
import { ConfigLoader } from './configLoader';
import { Messenger } from '../messenger';

export type ChromeExtensionMessageType = 'save' | 'load';

export interface ChromeExtensionMessageContent {
    type: ChromeExtensionMessageType
    config?: Config
}

export class ChromeExtensionConfigLoader extends ConfigLoader {
    messenger: Messenger<ChromeExtensionMessageContent>;

    constructor() {
        super();
        this.messenger = new Messenger(process.env.REPOSITORY_URL as string, 'injected', () => {
            throw new Error('not impremented');
        });
    }

    public async load(_defaultConfig: Config): Promise<Config> {
        const ret = await this.messenger.post({
            type: 'load',
        }) as Config;
        console.debug('loaded', ret);
        if (ret) {
            try {
                return Config.loadObject(ret);
            } catch (error) {
                console.warn('fallbacked to default config', error);
                return Config.default();
            }
        } else {
            return Config.default();
        }
    }

    public async save(_config: Config): Promise<void> {
        const ret = await this.messenger.post({
            type: 'save',
            config: _config,
        });
        console.debug('saved', _config, ret);
    }
}
