import { FacetDefinition } from 'facets';
import { createFacetInstanceUpdatedActivityItem } from 'server/activityItem/queries';
import { createActivityHooks } from 'server/utils/activityHooks';

export const createSequelizeHooksForFacetModel = (definition: FacetDefinition, Model: any) => {
	createActivityHooks({
		Model,
		onModelCreated: (actorId, modelId) =>
			createFacetInstanceUpdatedActivityItem(Model, definition, actorId, modelId, null),
		onModelUpdated: (actorId, modelId, previousModel) =>
			createFacetInstanceUpdatedActivityItem(
				Model,
				definition,
				actorId,
				modelId,
				previousModel,
			),
	});
};
