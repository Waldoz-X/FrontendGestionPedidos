import eslintRecommended from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import prettier from 'eslint-config-prettier';
import eslintPluginSecurity from 'eslint-plugin-security';

export default tseslint.config(
    eslintPluginSecurity.configs.recommended,
    {
        ignores: ['**/dist/**', '**/.angular/**', '**/coverage/**']
    },
    {
        files: ['**/*.ts'],
        extends: [
            eslintRecommended.configs.recommended,
            ...tseslint.configs.recommended,
            ...tseslint.configs.stylistic,
            ...angular.configs.tsRecommended,
            prettier
        ],
        processor: angular.processInlineTemplates,
        rules: {
            '@angular-eslint/directive-selector': [
                'error',
                {
                    type: 'attribute',
                    prefix: 'p',
                    style: 'camelCase'
                }
            ],
            '@angular-eslint/component-selector': [
                'error',
                {
                    type: 'element',
                    prefix: 'p',
                    style: 'kebab-case'
                }
            ],
            '@angular-eslint/component-class-suffix': [
                'error',
                {
                    suffixes: ['']
                }
            ],
            '@angular-eslint/no-host-metadata-property': 'off',
            '@angular-eslint/no-output-on-prefix': 'off',
            '@typescript-eslint/ban-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            'arrow-body-style': ['error', 'as-needed'],
            curly: 0,
            '@typescript-eslint/member-ordering': [
                'error',
                {
                    default: ['public-static-field', 'static-field', 'instance-field', 'public-instance-method', 'public-static-field']
                }
            ],
            'no-console': 0,
            'prefer-const': 0,
            'padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
                { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
                { blankLine: 'any', prev: ['case', 'default'], next: 'break' },
                { blankLine: 'any', prev: 'case', next: 'case' },
                { blankLine: 'always', prev: '*', next: 'return' },
                { blankLine: 'always', prev: 'block', next: '*' },
                { blankLine: 'always', prev: '*', next: 'block' },
                { blankLine: 'always', prev: 'block-like', next: '*' },
                { blankLine: 'always', prev: '*', next: 'block-like' },
                { blankLine: 'always', prev: ['import'], next: ['const', 'let', 'var'] }
            ]
        }
    },
    {
        files: ['**/*.html'],
        extends: [
            ...angular.configs.templateRecommended,
            prettier
        ],
        rules: {
            '@angular-eslint/template/eqeqeq': [
                'error',
                {
                    allowNullOrUndefined: true
                }
            ]
        }
    }
);
