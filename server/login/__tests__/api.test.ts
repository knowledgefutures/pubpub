import { setup, login, modelize } from 'stubstub';

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User admin {
                email: "normal@email.com"
            }
		}
        Member {
            permissions: "admin"
            User hyphen {
                email: "weird@something.with-hyphen.com"
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
