import { assert, exists } from 'utils/assert';
import { Resource } from './resource';

const ERR_PRIMARY_PARENT_RESOURCE_HAS_NO_DOI = 'Primary parent resource has no DOI';

export const primaryParentResourceHasDoi = (resource: Resource): boolean => {
	const primaryParentResource = resource.relationships.find((relationship) => {
		if (relationship.isParent) {
			switch (relationship.relation) {
				case 'Preprint':
				case 'Review':
				case 'Supplement':
					return true;
				default:
					return false;
			}
		}
		return false;
	});
	return (
		!exists(primaryParentResource) ||
		primaryParentResource.resource.identifiers.find(
			(identifier) => identifier.identifierKind === 'DOI',
		) !== undefined
	);
};

export const assertValidResource = (resource: Resource) => {
	assert(primaryParentResourceHasDoi(resource), ERR_PRIMARY_PARENT_RESOURCE_HAS_NO_DOI);
};
