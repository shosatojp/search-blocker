const defaultRules = {
    quotes: ['error', 'single'],
    'comma-dangle': ['error', {
        'arrays': 'always-multiline',
        'objects': 'always-multiline',
        'imports': 'always-multiline',
        'exports': 'always-multiline',
        'functions': 'never',
    }],
    semi: ['error', 'always'],
};

module.exports = {
    root: true,
    env: {
        es2022: true,
    },
    rules: defaultRules,
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            extends: [
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
            },
        },
    ],
};
