import { sanitizeOnVisibility } from './util';

export default (discussions, activePermissions, loginId) => {
	return sanitizeOnVisibility(discussions, activePermissions, loginId);
};
