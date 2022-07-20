import { UserDismissableKey } from '../../utils/userDismissable';
import { apiFetch } from './apiFetch';

export const dismissUserDismissable = async (key: UserDismissableKey) => {
	await apiFetch.post('/api/userDismissable', { key });
};
