import type { ActivityItem } from 'types';

import type { ActivityItemRenderer, ActivityRenderContext, RenderedActivityItem } from './types';

import { activityItemRenderers } from './renderers';

export const renderActivityItem = (
	item: ActivityItem,
	context: ActivityRenderContext,
): RenderedActivityItem => {
	const renderer = activityItemRenderers[item.kind] as ActivityItemRenderer<any>;
	return (renderer?.(item, context) as RenderedActivityItem) || null;
};
