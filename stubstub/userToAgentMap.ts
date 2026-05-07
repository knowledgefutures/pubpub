import type { Server } from 'http';

import supertest from 'supertest';

import { __appImmutableListenOnly } from '../server/server';

const userToAgentMap = new Map();

let server: Server | null = null;

export const login = async (user?: any): Promise<supertest.SuperAgentTest> => {
	server ??= __appImmutableListenOnly.listen();

	if (!user) {
		const loggedOutAgent = supertest.agent(server);
		return loggedOutAgent;
	}

	if (userToAgentMap.get(user)) {
		return userToAgentMap.get(user);
	}

	const createAgent = async () => {
		const agent = supertest.agent(server);

		try {
			await agent
				.post('/api/login')
				.send({
					email: user.email,
					password: user.plainPassword,
				})
				.expect(201);

			return agent;
		} catch (err) {
			throw new Error(`Failed to log in user ${user.email}: ${err}`);
		}
	};

	const entry = await createAgent();
	userToAgentMap.set(user, entry);

	return entry;
};

export const clearUserToAgentMap = () => {
	userToAgentMap.clear();
	server?.close();
};
