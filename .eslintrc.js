module.exports = {
    env: {
        browser: true,
        es6: true,
        jquery: true,
    },
    extends: ['eslint:recommended', 'prettier'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    rules: {
        'import/no-anonymous-default-export': 0,
        'no-control-regex': 0,
        'no-cond-assign': 0,
        'no-unused-vars': 0,
        'no-undef': 0,
        'no-self-assign': 0,
        'no-redeclare': 0,
        'no-useless-escape': 0,
        'no-func-assign': 0,
        'no-constant-condition': 0,
        'no-alert': 0,
        'no-console': 0,
        'no-new': 0,
        'node/sheband': 0,
        'no-empty': 0,
    },
    globals: {
        document: true,
        window: true,
        Shopify: true,
        theme: true,
    },
}
