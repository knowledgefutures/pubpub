import SftpClient from 'ssh2-sftp-client';

export type SftpConnectionParams = {
	host: string;
	port?: number | null;
	username: string;
	password: string;
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
		await client.connect({
			host: params.host,
			port: params.port ?? 22,
			username: params.username,
			password: params.password,
			readyTimeout: 10000,
		});
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
	content: Buffer,
): Promise<void> => {
	const client = new SftpClient();
	try {
		await client.connect({
			host: params.host,
			port: params.port ?? 22,
			username: params.username,
			password: params.password,
			readyTimeout: 10000,
		});
		await client.put(content, remotePath);
	} finally {
		await client.end().catch(() => {});
	}
};
