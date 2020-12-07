import { sanitizeOnVisibility } from './util';

export default (reviews, activePermissions, loginId) => {
	return sanitizeOnVisibility(reviews, activePermissions, loginId);
};
