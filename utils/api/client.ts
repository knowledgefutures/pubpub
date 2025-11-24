import { initClient } from '@ts-rest/core';

import { contract } from './contract';

export const createClient = (options: Parameters<typeof initClient>[1]) =>
	initClient(contract, options);
