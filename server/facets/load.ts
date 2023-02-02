import { FacetDefinition, FacetDoesNotExistError, FacetInstance, parseFacetInstance } from 'facets';
import { facetModels } from 'server/models';
import { indexByProperty } from 'utils/arrays';
import { mapObject } from 'utils/objects';

export const loadFacetInstancesForBindingIds = async <Def extends FacetDefinition>(
	facetDefinition: Def,
	facetBindingIds: string[],
): Promise<Record<string, FacetInstance<Def>>> => {
	const { name } = facetDefinition;
	const FacetModel = facetModels[name];
	if (FacetModel) {
		const instances = await FacetModel.findAll({ where: { facetBindingId: facetBindingIds } });
		const instancesByBindingId: Record<string, any> = indexByProperty(
			instances,
			'facetBindingId',
		);
		return mapObject(instancesByBindingId, (instance) => {
			const { valid } = parseFacetInstance(facetDefinition, instance.toJSON(), true);
			return valid;
		});
	}
	throw new FacetDoesNotExistError(facetDefinition.name);
};
