const defaultRules = {
    quotes: ['error', 'single'],
    'comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
    }],
    semi: ['error', 'always'],
    eqeqeq: ['error', 'always'],
    indent: ['error', 4, {
        SwitchCase: 1,
    }],
    'space-before-function-paren': 'off',
    curly: 'off',
    'no-new-func': 'off',
    'no-tabs': 'off',
    'no-new': 'off',
};

module.exports = {
    root: true,
    env: {
        es2022: true,
    },
    rules: defaultRules,
    extends: ['standard'],
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            extends: [
                'standard',
                'eslint:recommended',
                'plugin:@typescript-eslint/recommended',
            ],
            parser: '@typescript-eslint/parser',
            plugins: [

                '@typescript-eslint',
            ],
            parserOptions: {

                project: './tsconfig.json',
            },
            rules: {
                ...defaultRules,
                '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
                'space-before-function-paren': 'off',
                '@typescript-eslint/space-before-function-paren': 'off',
            },
        },
    ],
};
