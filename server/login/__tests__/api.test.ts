import { login, modelize, setup } from 'stubstub';

const normalEmail = `${crypto.randomUUID()}@email.com`;
const hyphenEmail = `${crypto.randomUUID()}@something.with-hyphen.com`;

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User admin {
                email: ${normalEmail}
            }
		}
        Member {
            permissions: "admin"
            User hyphen {
                email: ${hyphenEmail}
            }
        }
    }`;

setup(beforeAll, async () => {
	await models.resolve();
});

describe('/api/login', () => {
	it('allows you to login normally', async () => {
		await login(models.admin);
	});

	it('allows you to login with an email with hyphens and subdomains', async () => {
		await login(models.hyphen);
	});
});
