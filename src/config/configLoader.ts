import { Config } from './config';

export abstract class ConfigLoader {
    public abstract load(defaultConfig: Config): Promise<Config>;
    public abstract save(config: Config): Promise<void>;
}
