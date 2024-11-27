/* eslint-env node */

module.exports = {
    root: true,
    env: {
        es2020: true,
        browser: true,
        node: true,
        es6: true,
    },
    extends: [
        'react-app',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:react-hooks/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // project: true,
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
    },
    extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:prettier/recommended',
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
    ],
    plugins: ['react-refresh', 'prettier', '@typescript-eslint'],
    rules: {
        'max-len': ['off', { code: 100 }],
        'prettier/prettier': 'error',
        'generator-star-spacing': 'off',
        'import/no-named-as-default': 'off',
        'import/no-named-as-default-member': 'off',
        'no-unused-vars': ['warn', { vars: 'all', args: 'none', ignoreRestSiblings: false }], //没有使用的参数，不会报错。因为个人觉的把可用的参数写上去 有利于以后的维护。
        'no-use-before-define': 'off',
        'space-before-function-paren': 'off',

        '@typescript-eslint/ban-ts-ignore': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            },
        ],
    },
};
