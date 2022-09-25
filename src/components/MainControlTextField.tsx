import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

export interface MainControlTextFieldProps {
    text: string
    error: boolean
    onChange: (text: string) => void
}

export const MainControlTextField: React.FC<MainControlTextFieldProps> = (props: MainControlTextFieldProps) => {
    const [configText, setConfigText] = useState('');

    return <Stack>
        <TextField
            error={props.error}
            multiline
            fullWidth
            spellCheck={false}
            inputProps={{ style: { fontFamily: 'monospace', fontSize: 'medium', whiteSpace: 'nowrap' } }}
            rows={10}
            value={configText.length > 0 ? configText : props.text}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setConfigText(event.target.value);
            }}
        />
        <Stack direction='row'>
            <div style={{ flexGrow: 1 }}></div>
            <Button
                disabled={configText.length === 0 || configText === props.text}
                onClick={() => {
                    props.onChange(configText);
                    setConfigText('');
                }}
            >Apply</Button>
        </Stack>
    </Stack>;
};
