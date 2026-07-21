import { env } from 'server/env';
import { UnderlayIntegration } from 'server/models';
import { aes256Decrypt, aes256Encrypt } from 'utils/crypto';

/** Exact shape returned to clients — matches the ts-rest contract schema (no API key). */
export type UnderlayIntegrationClientConfig = {
	id: string;
	communityId: string | null;
	underlayOrg: string | null;
	underlayCollection: string | null;
	includeReleaseHtml: boolean;
	includeAssets: boolean;
	includePdfs: boolean;
	scheduleDays: number | null;
	lastPushedAt: string | null;
	lastPushSemver: string | null;
	lastPushStatus: 'success' | 'error' | 'noop' | null;
	lastPushError: string | null;
	hasApiKey: boolean;
};

const toClientConfig = (integration: UnderlayIntegration): UnderlayIntegrationClientConfig => ({
	id: integration.id,
	communityId: integration.communityId,
	underlayOrg: integration.underlayOrg,
	underlayCollection: integration.underlayCollection,
	includeReleaseHtml: integration.includeReleaseHtml,
	includeAssets: integration.includeAssets,
	includePdfs: integration.includePdfs,
	scheduleDays: integration.scheduleDays,
	lastPushedAt: integration.lastPushedAt
		? new Date(integration.lastPushedAt).toISOString()
		: null,
	lastPushSemver: integration.lastPushSemver,
	lastPushStatus: integration.lastPushStatus,
	lastPushError: integration.lastPushError,
	hasApiKey: Boolean(integration.apiKey),
});

export type UnderlayIntegrationConfigUpdate = {
	underlayOrg?: string | null;
	underlayCollection?: string | null;
	/** Plaintext API key. Omit to leave the stored key unchanged; empty string clears it. */
	apiKey?: string | null;
	includeReleaseHtml?: boolean;
	includeAssets?: boolean;
	includePdfs?: boolean;
	scheduleDays?: number | null;
};

/**
 * Return the community's integration config with the API key stripped (default) or with a
 * `hasApiKey` boolean so the UI can indicate a key is set without ever receiving it.
 */
export const getUnderlayIntegration = async (
	communityId: string,
): Promise<UnderlayIntegrationClientConfig | undefined> => {
	const integration = await UnderlayIntegration.findOne({ where: { communityId } });
	if (!integration) {
		return undefined;
	}
	return toClientConfig(integration);
};

/** Internal: fetch the integration with the decrypted API key. Never return this to a client. */
export const getUnderlayIntegrationWithKey = async (
	communityId: string,
): Promise<{ integration: UnderlayIntegration; apiKey: string | null } | undefined> => {
	const integration = await UnderlayIntegration.findOne({ where: { communityId } });
	if (!integration) {
		return undefined;
	}
	let apiKey: string | null = null;
	if (integration.apiKey && integration.apiKeyInitVec) {
		apiKey = aes256Decrypt(
			integration.apiKey,
			env.AES_ENCRYPTION_KEY,
			integration.apiKeyInitVec,
		);
	}
	return { integration, apiKey };
};

export const upsertUnderlayIntegration = async (
	communityId: string,
	update: UnderlayIntegrationConfigUpdate,
): Promise<UnderlayIntegrationClientConfig> => {
	const [integration] = await UnderlayIntegration.findOrCreate({
		where: { communityId },
		defaults: { communityId },
	});

	const patch: Partial<UnderlayIntegration> = {};
	if (update.underlayOrg !== undefined) patch.underlayOrg = update.underlayOrg;
	if (update.underlayCollection !== undefined)
		patch.underlayCollection = update.underlayCollection;
	if (update.includeReleaseHtml !== undefined)
		patch.includeReleaseHtml = update.includeReleaseHtml;
	if (update.includeAssets !== undefined) patch.includeAssets = update.includeAssets;
	if (update.includePdfs !== undefined) patch.includePdfs = update.includePdfs;
	if (update.scheduleDays !== undefined) patch.scheduleDays = update.scheduleDays;

	// Only touch the API key when explicitly provided. Empty string clears it.
	if (update.apiKey !== undefined) {
		if (update.apiKey) {
			const { encryptedText, initVec } = aes256Encrypt(update.apiKey, env.AES_ENCRYPTION_KEY);
			patch.apiKey = encryptedText;
			patch.apiKeyInitVec = initVec;
		} else {
			patch.apiKey = null;
			patch.apiKeyInitVec = null;
		}
	}

	await integration.update(patch);
	// Return sanitized shape.
	return (await getUnderlayIntegration(communityId))!;
};

export const recordPushResult = async (
	communityId: string,
	result: {
		status: 'success' | 'error' | 'noop';
		semver?: string | null;
		error?: string | null;
		/** Non-fatal issues (e.g. skipped assets) on a successful push; shown to the admin. */
		warning?: string | null;
		manifestHash?: string | null;
	},
): Promise<void> => {
	const integration = await UnderlayIntegration.findOne({ where: { communityId } });
	if (!integration) {
		return;
	}
	// lastPushError doubles as the warning text on a successful push (status tells them apart).
	const lastPushError =
		result.status === 'error' ? (result.error ?? null) : (result.warning ?? null);
	await integration.update({
		lastPushedAt: new Date(),
		lastPushStatus: result.status,
		lastPushSemver: result.semver ?? integration.lastPushSemver,
		lastPushError,
		lastManifestHash: result.manifestHash ?? integration.lastManifestHash,
	});
};
