import {
	Facet,
	FacetInstance,
	ALL_FACET_DEFINITIONS,
	parsePartialFacetInstance,
	SingleScopeId,
	FacetName,
	Facets,
} from 'facets';
import { FacetBinding, facetModels } from 'server/models';

type UpdateFacetByName<Name extends FacetName> = Partial<FacetInstance<Facets[Name]>>;
type UpdateFacetsQuery = Partial<{
	[Name in FacetName]: UpdateFacetByName<Name>;
}>;

const updateFacetForScope = async <Name extends FacetName>(
	scope: SingleScopeId,
	facet: Facet<Name>,
	update: UpdateFacetByName<Name>,
	actorId: string | null = null,
) => {
	const FacetModel = facetModels[facet.name];
	const existing = await FacetModel.findOne({
		include: [
			{
				model: FacetBinding,
				as: 'facetBinding',
				where: { ...scope },
				required: true,
			},
		],
	});
	if (existing) {
		await existing.update(update, { actorId });
	} else {
		const facetBinding = await FacetBinding.create({ ...scope });
		await FacetModel.create({ ...update, facetBindingId: facetBinding.id }, { actorId });
	}
};

export const updateFacetsForScope = async (
	scope: SingleScopeId,
	update: UpdateFacetsQuery,
	actorId: string | null = null,
) => {
	// Parse all the updates first -- if any fail, throw an error and don't update anything
	const parsedUpdate: Record<string, Record<string, any>> = {};
	Object.entries(update).forEach(([facetName, facetUpdate]) => {
		const facet = ALL_FACET_DEFINITIONS[facetName];
		const { valid } = parsePartialFacetInstance(facet, facetUpdate as any, true);
		if (Object.keys(valid).length > 0) {
			parsedUpdate[facetName] = valid;
		}
	});
	await Promise.all(
		Object.entries(parsedUpdate).map(async ([facetName, facetPatch]) => {
			const facet = ALL_FACET_DEFINITIONS[facetName];
			await updateFacetForScope(scope, facet, facetPatch, actorId);
		}),
	);
};
