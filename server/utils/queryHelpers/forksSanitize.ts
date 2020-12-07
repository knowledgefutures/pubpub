import { sanitizeOnVisibility } from './util';

export default (forks, activePermissions, loginId) => {
	return sanitizeOnVisibility(forks, activePermissions, loginId);
};
