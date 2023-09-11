import { initClient } from '@ts-rest/core';
import { contract } from './contract';

export const client = initClient(contract, {
	baseUrl: '',
	baseHeaders: {},
	credentials: 'include',
});
