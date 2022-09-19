import { Config } from './config';

export abstract class ConfigLoader {
    public abstract setModifiedDate(modifiedDate: Date): Promise<void>;
    public abstract getModifiedDate(): Promise<Date | null>;
    public abstract load(defaultConfig: Config): Promise<Config>;
    public abstract save(config: Config): Promise<void>;
}
