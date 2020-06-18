import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getPermissions } from './permissions';
import {
	createPubAttribution,
	updatePubAttribution,
	destroyPubAttribution,
	getPubAttributions,
} from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId,
		pubAttributionId: req.body.id,
	};
};

app.post(
	'/api/pubAttributions/batch',
	wrap(async (req, res) => {
		const { attributions } = req.body;
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);

		if (!permissions.create) {
			throw new ForbiddenError();
		}

		const existingAttributions = await getPubAttributions(requestIds.pubId);
		const orderingBase = existingAttributions.length
			? existingAttributions.concat().pop().order
			: 1;

		const newAttributions = await Promise.all(
			attributions
				.filter(
					(attr) =>
						!existingAttributions.some(
							(existingAttr) => existingAttr.userId === attr.userId,
						),
				)
				.map((attr, index, { length }) =>
					createPubAttribution({
						pubId: requestIds.pubId,
						order: orderingBase / 2 ** (length - index),
						...attr,
					}),
				),
		);

		return res
			.status(201)
			.json([...existingAttributions, ...newAttributions].sort((a, b) => a.order - b.order));
	}),
);

app.post('/api/pubAttributions', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createPubAttribution({
				...req.body,
				pubAttributionId: req.body.id,
			});
		})
		.then((newPubAttribution) => {
			return res.status(201).json(newPubAttribution);
		})
		.catch((err) => {
			console.error('Error in postPubAttribution: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/pubAttributions', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updatePubAttribution(
				{
					...req.body,
					pubAttributionId: req.body.id,
				},
				permissions.update,
			);
		})
		.then((updatedValues) => {
			return res.status(201).json(updatedValues);
		})
		.catch((err) => {
			console.error('Error in putPubAttribution: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/pubAttributions', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroyPubAttribution({
				...req.body,
				pubAttributionId: req.body.id,
			});
		})
		.then(() => {
			return res.status(201).json(req.body.id);
		})
		.catch((err) => {
			console.error('Error in deletePubAttribution: ', err);
			return res.status(500).json(err.message);
		});
});
