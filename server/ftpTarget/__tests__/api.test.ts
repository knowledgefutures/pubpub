import { vi } from 'vitest';

import { FtpTarget } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

const { SftpClient } = vi.hoisted(() => {
	const SftpClient = vi.fn().mockImplementation(() => ({
		connect: vi.fn().mockResolvedValue(undefined),
		exists: vi.fn().mockResolvedValue('d'),
		end: vi.fn().mockResolvedValue(undefined),
	}));
	return { SftpClient };
});

vi.mock('ssh2-sftp-client', () => ({ default: SftpClient }));

const models = modelize`
	Community communityA {
		Member {
			permissions: "admin"
			User communityAdmin {}
		}
	}
	Community communityB {}
	Community communityC {}
	User superAdmin {
		isSuperAdmin: true
	}
	User regularUser {}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll, () => {});

describe('/api/superadmin/ftp-targets', () => {
	it('requires superadmin to create an FTP target', async () => {
		const { communityA, regularUser } = models;
		const agent = await login(regularUser);
		await agent
			.post('/api/superadmin/ftp-targets')
			.send({ communityId: communityA.id, host: 'sftp.example.com', ftpType: 'sftp' })
			.expect(403);
	});

	it('requires superadmin to list via search', async () => {
		const { regularUser } = models;
		const agent = await login(regularUser);
		await agent.get('/api/superadmin/communities/search?q=test').expect(403);
	});

	it('creates an SFTP target with credentials', async () => {
		const { communityA, superAdmin } = models;
		const agent = await login(superAdmin);
		const { body } = await agent
			.post('/api/superadmin/ftp-targets')
			.send({
				communityId: communityA.id,
				host: 'sftp.example.com',
				ftpType: 'sftp',
				port: 22,
				filePath: '/uploads',
				username: 'ftpuser',
				password: 'secret',
			})
			.expect(201);
		expect(body.host).toBe('sftp.example.com');
		expect(body.ftpType).toBe('sftp');
		expect(body.port).toBe(22);
		expect(body.filePath).toBe('/uploads');
		expect(body.hasCredentials).toBe(true);
		expect(body.password).toBeUndefined();
		expect(body.passwordInitVec).toBeUndefined();
	});

	it('creates an FTPS target without credentials', async () => {
		const { communityB, superAdmin } = models;
		const agent = await login(superAdmin);
		const { body } = await agent
			.post('/api/superadmin/ftp-targets')
			.send({
				communityId: communityB.id,
				host: 'ftps.example.com',
				ftpType: 'ftps',
			})
			.expect(201);
		expect(body.ftpType).toBe('ftps');
		expect(body.hasCredentials).toBe(false);
	});

	it('allows multiple FTP targets for the same community', async () => {
		const { communityA, superAdmin } = models;
		const agent = await login(superAdmin);
		const { body } = await agent
			.post('/api/superadmin/ftp-targets')
			.send({ communityId: communityA.id, host: 'second.example.com', ftpType: 'ftps' })
			.expect(201);
		expect(body.host).toBe('second.example.com');
		expect(body.ftpType).toBe('ftps');
	});

	it('updates host, port, and filePath', async () => {
		const { communityA, superAdmin } = models;
		const existing = await FtpTarget.findOne({ where: { communityId: communityA.id } });
		const agent = await login(superAdmin);
		const { body } = await agent
			.put(`/api/superadmin/ftp-targets/${existing!.id}`)
			.send({ host: 'newhost.example.com', port: 2222, filePath: '/new/path' })
			.expect(200);
		expect(body.host).toBe('newhost.example.com');
		expect(body.port).toBe(2222);
		expect(body.filePath).toBe('/new/path');
	});

	it('clears credentials when username is set to empty string', async () => {
		const { communityA, superAdmin } = models;
		const existing = await FtpTarget.findOne({ where: { communityId: communityA.id } });
		const agent = await login(superAdmin);
		const { body } = await agent
			.put(`/api/superadmin/ftp-targets/${existing!.id}`)
			.send({ username: '' })
			.expect(200);
		expect(body.hasCredentials).toBe(false);
	});

	it('deletes an FTP target', async () => {
		const { communityB, superAdmin } = models;
		const existing = await FtpTarget.findOne({ where: { communityId: communityB.id } });
		const agent = await login(superAdmin);
		const { body } = await agent
			.delete(`/api/superadmin/ftp-targets/${existing!.id}`)
			.expect(200);
		expect(body.id).toBe(existing!.id);
		const gone = await FtpTarget.findByPk(existing!.id);
		expect(gone).toBeNull();
	});

	it('copies an FTP target to another community', async () => {
		const { communityA, communityC, superAdmin } = models;
		const source = await FtpTarget.findOne({ where: { communityId: communityA.id } });
		const agent = await login(superAdmin);
		const { body } = await agent
			.post(`/api/superadmin/ftp-targets/${source!.id}/copy`)
			.send({ communityId: communityC.id, copyCredentials: false })
			.expect(200);
		expect(body.communityId).toBe(communityC.id);
		expect(body.host).toBe(source!.host);
		expect(body.ftpType).toBe(source!.ftpType);
		expect(body.hasCredentials).toBe(false);
	});

	it('copies credentials when copyCredentials is true', async () => {
		const { communityA, communityC, superAdmin } = models;
		// create a fresh target with credentials on communityA
		const agent = await login(superAdmin);
		const { body: created } = await agent
			.post('/api/superadmin/ftp-targets')
			.send({
				communityId: communityA.id,
				host: 'creds.example.com',
				ftpType: 'sftp',
				username: 'user',
				password: 'pass',
			})
			.expect(201);
		const { body: copied } = await agent
			.post(`/api/superadmin/ftp-targets/${created.id}/copy`)
			.send({ communityId: communityC.id, copyCredentials: true })
			.expect(200);
		expect(copied.hasCredentials).toBe(true);
		expect(copied.password).toBeUndefined();
	});

	it('requires superadmin to update', async () => {
		const { communityA, regularUser } = models;
		const existing = await FtpTarget.findOne({ where: { communityId: communityA.id } });
		const agent = await login(regularUser);
		await agent
			.put(`/api/superadmin/ftp-targets/${existing!.id}`)
			.send({ host: 'evil.example.com' })
			.expect(403);
	});

	it('rejects create when SFTP connection fails', async () => {
		const { communityC, superAdmin } = models;
		SftpClient.mockImplementationOnce(() => ({
			connect: vi.fn().mockRejectedValue(new Error('Authentication failed')),
			end: vi.fn().mockResolvedValue(undefined),
		}));
		const agent = await login(superAdmin);
		await agent
			.post('/api/superadmin/ftp-targets')
			.send({
				communityId: communityC.id,
				host: 'sftp.example.com',
				ftpType: 'sftp',
				username: 'user',
				password: 'wrongpassword',
			})
			.expect(400);
	});

	it('validates ftpType on create', async () => {
		const { communityC, superAdmin } = models;
		const agent = await login(superAdmin);
		await agent
			.post('/api/superadmin/ftp-targets')
			.send({ communityId: communityC.id, host: 'sftp.example.com', ftpType: 'invalid' })
			.expect(400);
	});

	it('returns communities with existing FTP targets in search (multiple targets allowed)', async () => {
		const { communityA, superAdmin } = models;
		const agent = await login(superAdmin);
		const { body } = await agent
			.get(`/api/superadmin/communities/search?q=${encodeURIComponent(communityA.subdomain)}`)
			.expect(200);
		const found = body.find((c: any) => c.id === communityA.id);
		expect(found).toBeDefined();
	});
});
