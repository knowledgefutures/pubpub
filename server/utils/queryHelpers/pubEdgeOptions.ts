import {
	Community,
	CollectionPub,
	ExternalPublication,
	includeUserModel,
	Pub,
	PubAttribution,
	Release,
} from 'server/models';

export const getOptionsForIncludedPub = ({ includeCommunity }) => {
	return [
		includeCommunity && { model: Community, as: 'community' },
		{
			model: CollectionPub,
			as: 'collectionPubs',
		},
		{
			model: Release,
			as: 'releases',
		},
		{
			separate: true,
			model: PubAttribution,
			as: 'attributions',
			order: [['order', 'ASC']],
			include: [includeUserModel({ as: 'user' })],
		},
	].filter((x) => x);
};

export const getPubEdgeIncludes = ({
	// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
	includeCommunityForPubs,
	// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
	includeTargetPub,
	// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
	includePub,
} = {}) => {
	return [
		includeTargetPub && {
			model: Pub,
			as: 'targetPub',
			include: getOptionsForIncludedPub({ includeCommunity: includeCommunityForPubs }),
		},
		includePub && {
			model: Pub,
			as: 'pub',
			include: getOptionsForIncludedPub({ includeCommunity: includeCommunityForPubs }),
		},
		{
			model: ExternalPublication,
			as: 'externalPublication',
		},
	].filter((x) => x);
};
