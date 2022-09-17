import React, { useState } from "react";
import ReactDOM from "react-dom";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import Stack from "@mui/system/Stack";

import { Config } from '../config';
import { ResultControl } from './ResultControl';
import { GoogleBlockTarget } from '../blockers/google';
import { useConfig, useSetConfig } from "../providers/ConfigProvider";
import { MainControlTextField } from './MainControlTextField';
import { Rule } from "../rule";
import { BlockTargetGenerator } from "../blockers/blocker";
import './MainControl.css';


export interface MainControlProps {
    targetGenerator: BlockTargetGenerator
}

export const MainControl: React.FC<MainControlProps> = (props: MainControlProps) => {
    console.log("MainControl");

    const { config } = useConfig();
    const { setConfig } = useSetConfig();
    const [enabled, setEnabled] = useState(true);

    /**
     * portals
     */
    let matchedCount = 0;
    const matchedRules: Set<Rule> = new Set();
    const portals: React.ReactPortal[] = [];

    for (const e of props.targetGenerator.getTargets()) {
        const blockTarget = new GoogleBlockTarget(e);
        const matchedRule = config.match(blockTarget);
        const matched = matchedRule !== null;
        const blocked = enabled && matched;
        const portal = ReactDOM.createPortal(
            <ResultControl
                blockTarget={blockTarget}
                matched={matched}
                blocked={blocked}
            />,
            e,
        )
        portals.push(portal);
        if (matchedRule)
            matchedRules.add(matchedRule);

        matchedCount += Number(matched);
    }

    const handleDeleteRule = (rule: Rule) => {
        config.deleteRule(rule);
        setConfig(config);
    }

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
            <Stack direction='row'>
                {matchedRules.size > 0 &&
                    Array.from(matchedRules).map((rule: Rule) =>
                        <Chip
                            sx={{ m: 1 }}
                            key={rule.toString()}
                            label={rule.toString()}
                            variant='outlined'
                            onClick={() => handleDeleteRule(rule)}
                        />
                    )
                }
            </Stack>
            <MainControlTextField
                text={config.dumpString()}
                onChange={(text: string) => setConfig(Config.loadString(text))}
            />
        </Stack>
        {portals}
    </div>
};
