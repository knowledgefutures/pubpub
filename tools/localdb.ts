import { setupLocalDatabase } from '../localDatabase';

const main = async () => {
	await setupLocalDatabase(true);
	const { modelize } = await import('stubstub');
	const models = modelize`
        Community {
            createFullCommunity: true
            title: "Local Demo Community"
            subdomain: "demo"
            description: "This is just a test"
            accentColorDark: "#414c86",
            accentColorLight: "#fff",
            Member {
                permissions: "admin"
                User {
                    firstName: "Local"
                    lastName: "Admin"
                    email: "dev@pubpub.org"
                    password: "password123"
                    avatar: "https://assets.pubpub.org/_testing/51654612617885.jpg"
                }
            }
        }
    `;
	await models.resolve();
};

main();
