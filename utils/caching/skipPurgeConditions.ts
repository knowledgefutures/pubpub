import { isQubQub } from 'utils/environment';

export const isntProdOrTest = () =>
	process.env.NODE_ENV !== 'production' && !process.env.TEST_FASTLY_PURGE;

export const shouldntPurge = (tag?: string) => {
	const qubqub = isQubQub();
	const skip = isntProdOrTest();
	const shouldnt = qubqub || skip;
	if (!shouldnt) {
		return false;
	}

	if (!tag) {
		return 'true';
	}

	if (qubqub) {
		return `Skipping Fastly purge for ${tag} because qubqub doesn't use Fastly`;
	}

	return `Skipping Fastly purge for ${tag} in ${
		process.env.NODE_ENV ?? 'dev'
	} because NODE_ENV is not production and TEST_FASTLY_PURGE is not set`;
};
