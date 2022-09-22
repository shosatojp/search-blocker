import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Stack from '@mui/system/Stack';
import LoadingButton from '@mui/lab/LoadingButton';
import SyncIcon from '@mui/icons-material/Sync';

import { Config } from '../config/config';
import { ResultControl } from './ResultControl';
import { useConfig, useSetConfig } from '../providers/ConfigProvider';
import { MainControlTextField } from './MainControlTextField';
import { Rule } from '../rule';
import { BlockTarget, SiteSetting } from '../blockers/blocker';
import { RuleChip } from './RuleChip';

import { gdriveAuth, gdriveSync } from '../config/google-drive';
import { ConfigLoader } from '../config/configLoader';

export interface MainControlProps {
    siteSetting: SiteSetting
    /* created by MutationObserver before MainControl */
    earlyBlockTargets: BlockTarget[]
    configLoader: ConfigLoader
}

export const MainControl: React.FC<MainControlProps> = (props: MainControlProps) => {
    const { config } = useConfig();
    const { setConfig } = useSetConfig();
    const [enabled, setEnabled] = useState(true);
    const [, setModified] = useState(0);

    const [uploading, setUploading] = useState(false);

    /**
     * portals
     */
    let matchedCount = 0;
    const matchedRules: Set<Rule> = new Set();
    const portals: React.ReactPortal[] = [];

    const earlyBlockTargetElements: Map<HTMLElement, BlockTarget> =
        new Map<HTMLElement, BlockTarget>(props.earlyBlockTargets.map(e => [e.root, e]));

    for (const e of props.siteSetting.getTargets()) {
        const blockTarget = earlyBlockTargetElements.get(e.root) || e;
        const matchedRule = config.match(blockTarget);
        const matched = matchedRule !== null;
        const blocked = enabled && matched;
        const portal = ReactDOM.createPortal(
            <ResultControl
                blockTarget={blockTarget}
                matched={matched}
                blocked={blocked}
            />,
            e.root
        );
        portals.push(portal);
        if (matchedRule)
            matchedRules.add(matchedRule);

        matchedCount += Number(matched);
    }

    const handleDeleteRule = async (rule: Rule) => {
        config.deleteRule(rule);
        await setConfig(config);
    };

    const handleSync = async () => {
        try {
            setUploading(true);
            await gdriveAuth();
            const result = await gdriveSync('SearchBlocker.txt', config.dumpString(),
                await props.configLoader.getModifiedDate());
            switch (result.operation) {
                case 'download':
                    setConfig(Config.loadString(result.content), result.remoteModifiedDate);
                    break;
                case 'upload':
                    props.configLoader.setModifiedDate(result.remoteModifiedDate);
                    break;
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        /**
         * detect search result loading after DOMContentLoaded
         * - Google US: https://www.google.com/search?q=a&gl=us&hl=en
         * - DuckDuckGo: https://duckduckgo.com/?q=a
         */
        props.siteSetting.observeMutate(() => {
            setModified(v => v + 1);
        });
    }, [props.siteSetting]);

    return <div className="MainControl">
        <Stack>
            <Stack direction='row'>
                <Typography fontSize={20}>Search Blocker</Typography>
                <div style={{ flexGrow: 1 }}></div>
                <Switch
                    checked={enabled}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
                        setEnabled(checked);
                    }}
                />
            </Stack>
            <Typography>
                {matchedCount === 0 && 'Not matched'}
                {matchedCount === 1 && 'Matched 1 item'}
                {matchedCount > 1 && `Matched ${matchedCount} items`}
            </Typography>
            <div style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
                {matchedRules.size > 0 &&
                    Array.from(matchedRules).map((rule: Rule) =>
                        <RuleChip
                            key={rule.toString()}
                            rule={rule}
                            onDelete={async () => await handleDeleteRule(rule)}
                        />
                    )
                }
            </div>
            <MainControlTextField
                text={config.dumpString()}
                onChange={async (text: string) => await setConfig(Config.loadString(text))}
            />
            <Stack direction='row'>
                <LoadingButton
                    startIcon={<SyncIcon />}
                    onClick={handleSync}
                    loading={uploading}
                    variant='outlined'
                >Google Drive Sync</LoadingButton>
            </Stack>
        </Stack>
        {portals}
    </div>;
};
