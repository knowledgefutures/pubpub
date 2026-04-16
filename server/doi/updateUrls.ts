/**
 * Updates resolution URLs for DOIs at Crossref or DataCite.
 *
 * Crossref: uses the "bulk URL update" mechanism — a tab-separated text file
 * POSTed to the same deposit endpoint used for metadata deposits, but with a
 * different operation code. This updates ONLY the resolution URL; all other
 * metadata (title, authors, collection/issue context, references) is untouched.
 * See: https://www.crossref.org/documentation/register-maintain-records/maintaining-your-metadata/updating-your-metadata/#00172
 *
 * DataCite: uses PUT /dois/{id} with only the `url` attribute.
 */
import type * as types from 'types';

import { env } from 'server/env';
import { expect } from 'utils/assert';
import { aes256Decrypt } from 'utils/crypto';

import { postToCrossref, resolveCrossrefCredentials } from './submit';

// ---------------------------------------------------------------------------
// DataCite credential helper
// ---------------------------------------------------------------------------

const getDataciteCredentials = (depositTarget: types.DepositTarget) => {
	const rawPassword = aes256Decrypt(
		expect(depositTarget.password),
		expect(env.AES_ENCRYPTION_KEY),
		expect(depositTarget.passwordInitVec),
	);
	return Buffer.from(`${depositTarget.username}:${rawPassword}`).toString('base64');
};

// ---------------------------------------------------------------------------
// Crossref: URL-only update via bulk URL update format
// ---------------------------------------------------------------------------

/**
 * Updates the resolution URL for a single Crossref DOI.
 *
 * Uses the tab-separated bulk URL update format:
 *   H: email=crossref@pubpub.org;fromPrefix=10.xxxx
 *   10.xxxx/suffix\thttps://new-url.example.com
 *
 * See: https://www.crossref.org/documentation/register-maintain-records/maintaining-your-metadata/updating-your-metadata/#00172
 */
const updateCrossrefUrl = async (
	doi: string,
	newUrl: string,
	depositTarget: types.DepositTarget | null,
) => {
	const prefix = doi.split('/')[0];
	const credentials = resolveCrossrefCredentials(depositTarget);

	const fileContent = [
		`H: email=crossref@pubpub.org;fromPrefix=${prefix}`,
		`${doi}\t${newUrl}`,
	].join('\n');

	return postToCrossref({
		content: fileContent,
		contentType: 'text/plain',
		filename: `url-update-${Date.now()}.txt`,
		credentials,
		operation: 'doDOICitUpload',
	});
};

// ---------------------------------------------------------------------------
// DataCite: URL-only update
// ---------------------------------------------------------------------------

/**
 * Updates the resolution URL for a single DataCite DOI without touching
 * any other metadata. Sends a PUT with only the `url` attribute.
 */
const updateDataciteUrl = async (
	doi: string,
	newUrl: string,
	depositTarget: types.DepositTarget,
) => {
	const dataciteUrl = env.DATACITE_DEPOSIT_URL;
	if (!dataciteUrl) {
		throw new Error('DATACITE_DEPOSIT_URL environment variable not set');
	}

	const encodedCredentials = getDataciteCredentials(depositTarget);
	const body = {
		data: {
			id: doi,
			type: 'dois',
			attributes: { url: newUrl },
		},
	};

	const response = await fetch(`${dataciteUrl}/${doi}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			Authorization: `Basic ${encodedCredentials}`,
		},
		body: JSON.stringify(body),
	});

	const result = await response.json();
	if (result.errors?.length > 0) {
		throw new Error(`DataCite URL update failed for ${doi}: ${JSON.stringify(result.errors)}`);
	}
	return result;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type DoiUrlUpdate = {
	doi: string;
	newUrl: string;
};

/**
 * Updates the resolution URL for a single DOI at the appropriate registrar.
 * Determines Crossref vs DataCite from the depositTarget's `service` field.
 */
export const updateDoiUrl = async (
	update: DoiUrlUpdate,
	depositTarget: types.DepositTarget | null,
) => {
	const service = depositTarget?.service ?? 'crossref';
	if (service === 'datacite') {
		if (!depositTarget) {
			throw new Error(`DataCite DOI ${update.doi} has no deposit target with credentials`);
		}
		return updateDataciteUrl(update.doi, update.newUrl, depositTarget);
	}
	return updateCrossrefUrl(update.doi, update.newUrl, depositTarget);
};

/**
 * Best-effort batch update of DOI URLs. Logs failures but does not throw,
 * since this runs after the community has already been deleted.
 *
 * Runs sequentially to avoid overwhelming Crossref's submission queue
 * (they have a 10,000 pending submission limit and may rate-limit).
 */
export const updateDoiUrlsBestEffort = async (
	updates: DoiUrlUpdate[],
	depositTarget: types.DepositTarget | null,
) => {
	const results: { doi: string; success: boolean; error?: string }[] = [];

	for (const update of updates) {
		try {
			// biome-ignore lint: sequential is intentional to avoid overwhelming Crossref's queue
			await updateDoiUrl(update, depositTarget);
			results.push({ doi: update.doi, success: true });
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error(`[DOI URL update] Failed for ${update.doi}: ${message}`);
			results.push({ doi: update.doi, success: false, error: message });
		}
	}

	return results;
};
