import type { Readable } from 'stream';

import SftpClient from 'ssh2-sftp-client';

/** Log in with a password or an SSH private key; a target stores one or the other. */
export type SftpConnectionParams = {
	host: string;
	port?: number | null;
	username: string;
	password?: string | null;
	privateKey?: string | null;
};

export const getSftpConnectOptions = (params: SftpConnectionParams) => {
	if (!params.password && !params.privateKey) {
		throw new Error('A password or a private key is required');
	}
	return {
		host: params.host,
		port: params.port ?? 22,
		username: params.username,
		...(params.privateKey
			? { privateKey: params.privateKey }
			: { password: params.password ?? undefined }),
		readyTimeout: 10000,
	};
};

/**
 * Tidy a pasted private key: unify line endings and trim stray whitespace, keeping the trailing
 * newline some parsers expect. Returns null when the text isn't a PEM or OpenSSH private key.
 */
export const normalizePrivateKey = (raw: string) => {
	const key = raw.replace(/\r\n?/g, '\n').trim();
	if (
		!/^-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----\n[\s\S]+\n-----END [A-Z0-9 ]*PRIVATE KEY-----$/.test(
			key,
		)
	) {
		return null;
	}
	return `${key}\n`;
};

/**
 * Tests that an SFTP connection can be established with the given credentials.
 * Optionally verifies that filePath is accessible on the remote server.
 * Throws a descriptive Error on failure; caller should wrap in BadRequestError.
 */
export const testSftpConnection = async (
	params: SftpConnectionParams,
	filePath?: string | null,
): Promise<void> => {
	const client = new SftpClient();
	try {
		await client.connect(getSftpConnectOptions(params));
		if (filePath) {
			const exists = await client.exists(filePath);
			if (!exists) {
				throw new Error(`Remote path does not exist: ${filePath}`);
			}
		}
	} catch (err: any) {
		const message = err?.message ?? 'Unknown error';
		throw new Error(`SFTP connection test failed: ${message}`);
	} finally {
		await client.end().catch(() => {});
	}
};

/**
 * Uploads a file buffer to a remote path via SFTP.
 * Intended for use by background worker tasks.
 */
export const uploadFileViaSftp = async (
	params: SftpConnectionParams,
	remotePath: string,
	content: Buffer | Readable,
): Promise<void> => {
	const client = new SftpClient();
	try {
		await client.connect(getSftpConnectOptions(params));
		await client.put(content, remotePath);
	} finally {
		await client.end().catch(() => {});
	}
};
