import React, { useEffect, useState } from "react";
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
            <Stack direction='row'>
                {openDetail &&
                    candidates.map((rule: Rule) =>
                        <Tooltip
                            key={rule.toString()}
                            title={`block '${rule.toString()}'`}>
                            <Chip
                                onClick={() => blockHandler(rule)}
                                sx={{ m: 1 }}
                                variant="outlined"
                                label={rule.toString()}
                            />
                        </Tooltip>
                    )
                }
            </Stack>
            <div style={{ flexGrow: 1 }}></div>
            {openDetail ?
                <IconButton size="small" onClick={() => setOpenDetail(false)}><ExpandLessIcon /></IconButton> :
                <IconButton size="small" onClick={() => setOpenDetail(true)}><ExpandMoreIcon /></IconButton>}
        </Stack>

    </>;
};
