import { subscribeUser } from '../utils/mailchimp';

export const subscribeToMailchimp = (inputValues) => {
	const email = inputValues.email;
	const list = inputValues.list || '2847d5271c';
	const tags = inputValues.tags || [];
	return subscribeUser(email, list, tags);
};
