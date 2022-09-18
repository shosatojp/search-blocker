import React from 'react';
import { Rule } from '../rule';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import IconButton from '@mui/material/IconButton';


export interface RuleChipProps {
    rule: Rule
    onBlock?: () => void
    onDelete?: () => void
}

export const RuleChip: React.FC<RuleChipProps> = (props: RuleChipProps) => {
    return <span style={{
        display: 'inline-block',
        margin: 10,
        borderRadius: 20,
        border: 'solid 1px darkgray',
    }}>
        <span style={{ fontFamily: 'monospace', marginLeft: 10 }}>{props.rule.toString()}</span>
        {props.onDelete &&
            <IconButton onClick={() => props.onDelete && props.onDelete()}><DeleteIcon fontSize="small" /></IconButton>}
        {props.onBlock &&
            <IconButton onClick={() => props.onBlock && props.onBlock()}><BlockIcon fontSize="small" /></IconButton>}
    </span>
};
