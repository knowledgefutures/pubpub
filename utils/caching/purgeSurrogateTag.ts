import { isDuqDuq, isQubQub } from 'utils/environment';

/**
 * Purge a surrogate tag from Fastly
 *
 * @param tag The tag to purge, this should be the domain
 * @param soft Whether to do a soft purge. This marks the content as stale and will serve stale content while the new content is being fetched
 *
 * @throws {Error} If the purge action did not succeed, or if
 * FASTLY_SERVICE_ID_${PROD|DUQDUQ} or FASTLY_PURGE_TOKEN_${PROD|DUQDUQ} is not set
 */
export const purgeSurrogateTag = async (tag: string, soft = false) => {
	let id: string;

	const duqduq = isDuqDuq();
	const qubqub = isQubQub();

	const [serviceId, token] = duqduq
		? [process.env.FASTLY_SERVICE_ID_DUQDUQ, process.env.FASTLY_PURGE_TOKEN_DUQDUQ]
		: [process.env.FASTLY_SERVICE_ID_PROD, process.env.FASTLY_PURGE_TOKEN_PROD];

	if (!token) {
		throw new Error(`No Fastly purge token found for ${duqduq ? 'DuqDuq' : 'prod'}'}
		Did you forget to set FASTLY_PURGE_TOKEN_${duqduq ? 'DUQDUQ' : 'PROD'}?`);
	}
	if (!serviceId) {
		throw new Error(`No Fastly service ID found for ${duqduq ? 'DuqDuq' : 'prod'}'}
		Did you forget to set FASTLY_SERVICE_ID_${duqduq ? 'DUQDUQ' : 'PROD'}?`);
	}

	const modifiedTag = duqduq ? tag.replace('pubpub.org', 'duqduq.org') : tag;
	if (qubqub) {
		console.log(`Skipping Fastly purge for ${modifiedTag} because qubqub doesn't use Fastly`);
		return '';
	}

	if (process.env.NODE_ENV !== 'production' && !process.env.TEST_FASTLY_PURGE) {
		console.log(
			`Skipping Fastly purge for ${modifiedTag} in ${
				duqduq ? 'DuqDuq' : qubqub ? 'qubqub' : 'prod'
			} because NODE_ENV is not production and TEST_FASTLY_PURGE is not set`,
		);
		return '';
	}

	try {
		const purge = await fetch(
			`https://api.fastly.com/service/${serviceId}/purge/${modifiedTag}`,
			{
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Fastly-Key': token,
					...(soft ? { 'Fastly-Soft-Purge': '1' } : {}),
				},
			},
		);

		const response = await purge.json();

		if (response.status !== 'ok') {
			throw new Error(
				`Purge action on service ${
					duqduq ? 'DuqDuq' : 'prod'
				}/${serviceId} for ${modifiedTag} did not succeed.\n${response.msg}`,
			);
		}

		id = response.id as string;
	} catch (e: any) {
		throw new Error(
			`Purge action on service ${serviceId} for ${modifiedTag} did not succeed.\n${e}`,
		);
	}

	return id;
};
