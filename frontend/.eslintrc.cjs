module.exports = {
	root: true,
	env: { browser: true, es2022: true, jest: true, node: true },
	parser: '@typescript-eslint/parser',
	parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
	plugins: ['@typescript-eslint', 'react', 'react-hooks'],
	extends: [
		'eslint:recommended',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	rules: {
		'react/react-in-jsx-scope': 'off',
	},
	settings: {
		react: { version: 'detect' },
	},
};
