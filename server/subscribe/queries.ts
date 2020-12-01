import { subscribeUser } from 'server/utils/mailchimp';

export const subscribeToMailchimp = (inputValues) => {
	const email = inputValues.email;
	const list = inputValues.list || 'be26e45660';
	const tags = inputValues.tags || [];
	return subscribeUser(email, list, tags);
};
