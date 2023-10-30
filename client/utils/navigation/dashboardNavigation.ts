import {
	ActiveDashboardMode,
	DashboardMenuState,
	LocationData,
	RenderedDashboardMenuItem,
} from 'types';
import { DashboardMode, getDashUrl } from 'utils/dashboard';
import { checkMemberPermission } from 'utils/permissions';
import { pubPubIcons } from 'client/utils/icons';
import { assert } from 'utils/assert';

import { menuItemsByScopeType, MenuItem, ReadablePageContext } from './dashboardMenuItems';

const inferDashboardModeFromPath = (path: string): DashboardMode => {
	const [_nothing, _dash, ...rest] = path.split('/');
	assert(_nothing === '' && _dash === 'dash');
	const next = rest.shift();
	if (next === 'collection' || next === 'pub') {
		rest.shift(); // This is the Collection or Pub slug
		return rest.shift() as DashboardMode;
	}
	return next as DashboardMode;
};

const getActiveDashboardMode = (locationData: LocationData): null | ActiveDashboardMode => {
	const {
		path,
		isDashboard,
		params: { subMode, reviewNumber },
	} = locationData;
	if (isDashboard) {
		if (reviewNumber) {
			return {
				mode: 'reviews',
				subMode: reviewNumber,
			};
		}
		const mode = inferDashboardModeFromPath(path);
		return {
			mode,
			subMode: subMode || null,
		};
	}
	return null;
};

const shouldShowMenuItemInContext = (item: MenuItem, context: ReadablePageContext) => {
	const {
		scopeData: {
			activePermissions: { activePermission },
		},
	} = context;
	const { requiredPermission, shown } = item;
	if (requiredPermission && !checkMemberPermission(activePermission, requiredPermission)) {
		return false;
	}
	if (shown && !shown(context)) {
		return false;
	}
	return true;
};

const getRenderedMenuItemInContext = (
	item: MenuItem,
	context: ReadablePageContext,
	activeDashboardMode: null | ActiveDashboardMode,
): RenderedDashboardMenuItem => {
	const { title, icon, count, dashboardMode } = item;
	const {
		scopeData: {
			elements: { activeCollection },
		},
		locationData: {
			params: { pubSlug },
		},
	} = context;

	const href = getDashUrl({
		mode: dashboardMode,
		pubSlug,
		collectionSlug: activeCollection?.slug,
	});

	return {
		title,
		href,
		icon: pubPubIcons[icon],
		count: count ? count(context) : null,
		active: activeDashboardMode?.mode === dashboardMode,
	};
};

export const getDashboardMenuState = (context: ReadablePageContext): DashboardMenuState => {
	const { locationData, scopeData } = context;
	const { isBasePubPub } = locationData;
	if (isBasePubPub) {
		return { menuItems: [], activeMode: null };
	}
	const {
		elements: { activeTargetType },
	} = scopeData;
	const allMenuItems = menuItemsByScopeType[activeTargetType];
	const activeMode = getActiveDashboardMode(locationData);
	const menuItems = allMenuItems
		.filter((item) => shouldShowMenuItemInContext(item, context))
		.map((item) => getRenderedMenuItemInContext(item, context, activeMode));
	return { menuItems, activeMode };
};
