import React, { useEffect, useState } from "react";
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { RuleChip } from './RuleChip';
import { useConfig, useSetConfig } from "../providers/ConfigProvider";
import { Rule } from "../rule";
import { BlockTarget } from "../blockers/blocker";

export interface ResultControlProps {
    blockTarget: BlockTarget,
    blocked: boolean,
    matched: boolean,
}

export const ResultControl: React.FC<ResultControlProps> = (props: ResultControlProps) => {
    const [openDetail, setOpenDetail] = useState(false);
    const { config } = useConfig();
    const { setConfig } = useSetConfig();

    useEffect(() => {
        props.blockTarget.hide(props.blocked);
        props.blockTarget.highlight(props.matched, '#ffe7e7');
    }, [props.blocked, props.matched, props.blockTarget]);

    const blockHandler = (rule: Rule) => {
        config.addRule(rule);
        setConfig(config);
    };
    const candidates = Rule.getCandidate(props.blockTarget.url);

    return <>
        <Stack direction='row'>
            <div style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
                {openDetail &&
                    candidates.map((rule: Rule) =>
                        <RuleChip
                            key={rule.toString()}
                            onBlock={() => blockHandler(rule)}
                            rule={rule}
                        />
                    )
                }
            </div>
            <div style={{ flexGrow: 1 }}></div>
            {openDetail ?
                <IconButton size="small" onClick={() => setOpenDetail(false)}><ExpandLessIcon /></IconButton> :
                <IconButton size="small" onClick={() => setOpenDetail(true)}><ExpandMoreIcon /></IconButton>}
        </Stack>

    </>;
};
