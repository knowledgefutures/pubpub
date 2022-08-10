import { IconName } from '../Icon/Icon';

type CommunityOption = {
	title: string;
	subdomain: string;
	icon?: IconName;
};

// eslint-disable-next-line import/no-mutable-exports
let communities: CommunityOption[] = [];

if (process.env.NODE_ENV !== 'production') {
	communities = [
		{ title: 'PubPub Demo Site', subdomain: 'demo', icon: 'build' },
		{ title: 'DesignSpace', subdomain: 'designspace', icon: 'clean' },
		{ title: 'KFG Notes', subdomain: 'kfg-notes', icon: 'document' },
		{ title: 'HDSR', subdomain: 'hdsr', icon: 'regression-chart' },
		{ title: 'BAAS', subdomain: 'baas', icon: 'moon' },
		{ title: 'Cursor', subdomain: 'cursor', icon: 'book' },
	];
}

export { communities };
