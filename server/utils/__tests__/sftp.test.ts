import { getSftpConnectOptions, normalizePrivateKey } from '../sftp';

const key = '-----BEGIN RSA PRIVATE KEY-----\nAAAA\nBBBB\n-----END RSA PRIVATE KEY-----';

describe('normalizePrivateKey', () => {
	it('unifies line endings, trims, and ends with a newline', () => {
		expect(normalizePrivateKey(`\n  ${key.replace(/\n/g, '\r\n')}\r\n\n`)).toBe(`${key}\n`);
	});

	it('accepts OpenSSH and PKCS#8 headers', () => {
		const openssh =
			'-----BEGIN OPENSSH PRIVATE KEY-----\nAAAA\n-----END OPENSSH PRIVATE KEY-----';
		const pkcs8 = '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----';
		expect(normalizePrivateKey(openssh)).toBe(`${openssh}\n`);
		expect(normalizePrivateKey(pkcs8)).toBe(`${pkcs8}\n`);
	});

	it('rejects public keys and other text', () => {
		expect(normalizePrivateKey('ssh-rsa AAAA user@host')).toBeNull();
		expect(
			normalizePrivateKey('-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----'),
		).toBeNull();
		expect(normalizePrivateKey('hunter2')).toBeNull();
	});
});

describe('getSftpConnectOptions', () => {
	const base = { host: 'sftp.example.com', username: 'user' };

	it('uses the key when one is set, and not the password', () => {
		const options = getSftpConnectOptions({
			...base,
			port: 10022,
			privateKey: key,
			password: 'pw',
		});
		expect(options).toMatchObject({ port: 10022, privateKey: key });
		expect(options).not.toHaveProperty('password');
	});

	it('falls back to the password and port 22', () => {
		const options = getSftpConnectOptions({ ...base, password: 'pw' });
		expect(options).toMatchObject({ port: 22, password: 'pw' });
		expect(options).not.toHaveProperty('privateKey');
	});

	it('throws without a password or key', () => {
		expect(() => getSftpConnectOptions(base)).toThrow();
	});
});
