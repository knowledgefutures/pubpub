import { ActivityItem } from 'types';

import { activityItemRenderers } from './renderers';
import { ActivityItemRenderer, ActivityRenderContext, RenderedActivityItem } from './types';

export const renderActivityItem = (
	item: ActivityItem,
	context: ActivityRenderContext,
): RenderedActivityItem => {
	// This cast avoids a TypeScript error:
	// Expression produces a union type that is too complex to represent. ts(2590)
	const renderer = activityItemRenderers[item.kind] as ActivityItemRenderer<any>;
	return (renderer?.(item, context) as RenderedActivityItem) || null;
};
