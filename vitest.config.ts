import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		globalSetup: path.resolve(__dirname, 'stubstub/global/setup.ts'),
		setupFiles: [path.resolve(__dirname, '.test/setup-env.js')],
		testTimeout: 10000,
		environment: 'node',
		reporters: 'verbose',
		watch: false,
		clearMocks: true,
		retry: 3,
		include: ['./**/__tests__/**/*.test.[jt]s?(x)'],
	},
	resolve: {
		alias: [
			{
				find: /(.*scss.*)/,
				replacement: path.resolve(__dirname, 'utils/storybook/styleMock.js'),
			},
		],
	},
});
