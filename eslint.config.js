// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: [ '**/*.svelte' ],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser
			}
		}
	},
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			'svelte/no-at-html-tags': 'off',
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		files: ['**/*.test.ts', '**/*.spec.ts', '**/*.example.ts'],
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
			'svelte/require-each-key': 'off'
		}
	},
	{
		ignores: [ 'node_modules', '.git', 'dist', 'build', 'dev/.svelte-kit/**', '.svelte-kit/**', 'coverage/**', 'e2e/**', 'playwright-report/**' ]
	}
)
