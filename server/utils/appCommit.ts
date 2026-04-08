import { env } from 'server/env';

const normalizeAppCommit = (appCommit?: string | null) => {
	const normalizedAppCommit = appCommit?.trim();

	if (!normalizedAppCommit) {
		return undefined;
	}

	return normalizedAppCommit;
};

export const resolveAppCommit = () => {
	const appCommitFromEnvironment = normalizeAppCommit(
		env.APP_COMMIT ?? process.env.HEROKU_SLUG_COMMIT,
	);

	return appCommitFromEnvironment;
};
