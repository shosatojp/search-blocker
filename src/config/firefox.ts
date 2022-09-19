import { Config } from './config';
import { ConfigLoader } from './configLoader';
import { Messenger } from '../messenger';

export type FirefoxExtensionMessageContent = {
    type: 'save'
    key: string
    content: unknown
} | {
    type: 'load'
    key: string
}

export class FirefoxExtensionConfigLoader extends ConfigLoader {
    messenger: Messenger<FirefoxExtensionMessageContent>;

    constructor() {
        super();
        this.messenger = new Messenger(process.env.REPOSITORY_URL as string, 'injected', () => {
            throw new Error('not impremented');
        });
    }

    public async load(_defaultConfig: Config): Promise<Config> {
        const ret = await this.messenger.post({
            type: 'load',
            key: 'config',
        }) as Config;
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

    public async save(config: Config): Promise<void> {
        await this.messenger.post({
            type: 'save',
            key: 'config',
            content: config,
        });
    }

    public async setModifiedDate(modifiedDate: Date): Promise<void> {
        await this.messenger.post({
            type: 'save',
            key: 'modifiedDate',
            content: modifiedDate.toJSON(),
        });
    }

    public async getModifiedDate(): Promise<Date | null> {
        const ret = await this.messenger.post({
            type: 'load',
            key: 'modifiedDate',
        }) as (string | null);
        return ret ? new Date(ret) : null;
    }
}
