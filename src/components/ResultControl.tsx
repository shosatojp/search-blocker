import React, { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { RuleChip } from './RuleChip';
import { useConfig, useSetConfig } from '../providers/ConfigProvider';
import { HostNameRule, Rule } from '../rule';
import { BlockTarget } from '../blockers/blocker';

export interface ResultControlProps {
    blockTarget: BlockTarget
    blocked: boolean
    matched: boolean
    disabled: boolean
}

export const ResultControl: React.FC<ResultControlProps> = (props: ResultControlProps) => {
    const [openDetail, setOpenDetail] = useState(false);
    const { config } = useConfig();
    const { setConfig } = useSetConfig();

    useEffect(() => {
        props.blockTarget.hide(props.blocked);
        props.blockTarget.highlight(props.matched, '#ffe7e7');
    }, [props.blocked, props.matched, props.blockTarget]);

    const blockHandler = async (rule: Rule) => {
        config.addRule(rule);
        await setConfig(config);
    };
    const url = props.blockTarget.url;
    const candidates = url ? HostNameRule.getCandidate(url) : [];

    return <>
        <Stack direction='row'>
            <div style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
                {openDetail &&
                    candidates.map((rule: Rule) =>
                        <RuleChip
                            key={rule.toString()}
                            onBlock={async () => await blockHandler(rule)}
                            rule={rule}
                            disabled={props.disabled}
                        />
                    )
                }
            </div>
            <div style={{ flexGrow: 1 }}></div>
            <div>
                {openDetail
                    ? <IconButton disabled={props.disabled} size="small" onClick={() => setOpenDetail(false)}><ExpandLessIcon /></IconButton>
                    : <IconButton disabled={props.disabled} size="small" onClick={() => setOpenDetail(true)}><ExpandMoreIcon /></IconButton>}
            </div>
        </Stack>

    </>;
};
