import React, { createContext, useContext, useState } from 'react';
import { Config } from '../config/config';
import { ConfigLoader } from '../config/configLoader';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ConfigContextValue { }

const ConfigContext = createContext<ConfigContextValue>({});

let config: Config;

let notify: () => void;
let save: (config: Config) => Promise<void>;

export interface ConfigProviderProps {
    configLoader: ConfigLoader,
    config: Config,
    children: React.ReactElement | React.ReactElement[]
}

export const ConfigProvider: React.FC<ConfigProviderProps> = (props: ConfigProviderProps) => {
    const [, setModified] = useState<number>(0);
    notify = () => {
        setModified(v => v + 1);
    };
    save = props.configLoader.save.bind(props.configLoader);

    if (!config)
        config = props.config;

    return <ConfigContext.Provider value={{}}>
        {props.children}
    </ConfigContext.Provider>;
};

/**
 * receiver
 */
export const useConfig = () => {
    useContext(ConfigContext);

    return { config };
};

/**
 * notifier
 */
export const useSetConfig = () => {
    return {
        setConfig: (_config: Config) => {
            config = _config;
            notify();
            save(config);
        },
    };
};
