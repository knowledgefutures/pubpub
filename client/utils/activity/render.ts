import { ActivityItem } from 'types';

import { activityItemRenderers } from './renderers';
import { ActivityItemRenderer, ActivityRenderContext, RenderedActivityItem } from './types';

export const renderActivityItem = (
	item: ActivityItem,
	context: ActivityRenderContext,
): RenderedActivityItem => {
	const renderer = activityItemRenderers[item.kind] as ActivityItemRenderer<any>;
	return (renderer?.(item, context) as RenderedActivityItem) || null;
};
