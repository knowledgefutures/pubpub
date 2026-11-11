import { vi } from 'vitest';

import { env } from 'server/env';
import { Pub, PubEdge } from 'server/models';
import { modelize, setup } from 'stubstub';

import { validatePubRelationshipsForDeposit } from '../validate';

const models = modelize`
	Community community {
		Pub reviewPub {}
		Pub reviewedPub {}
	}
`;

setup(beforeAll, async () => {
	await models.resolve();
	await Pub.update(
		{ doi: '10.1162/99608f92.reviewed' },
		{ where: { id: models.reviewedPub.id } },
	);
	await PubEdge.create({
		pubId: models.reviewPub.id,
		targetPubId: models.reviewedPub.id,
		relationType: 'comment',
		pubIsParent: false,
		approvedByTarget: true,
		rank: 'a',
	});
});

const respond = (...replies: (number | [number, unknown])[]) => {
	const fetchMock = vi.fn();
	replies.forEach((reply) => {
		const [status, body] = Array.isArray(reply) ? reply : [reply, {}];
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
};

beforeEach(() => {
	env.DOI_SUBMISSION_URL = 'https://doi.crossref.org/servlet/deposit';
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("checking a connected pub's DOI in Crossref", () => {
	it('retries a rate-limited lookup instead of calling the DOI missing', async () => {
		const fetchMock = respond(429, 200);
		expect(await validatePubRelationshipsForDeposit(models.reviewPub.id)).toEqual([]);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('only calls the DOI missing when Crossref and the DOI registry both say so', async () => {
		respond(404, [200, [{ DOI: '10.1162/99608f92.reviewed', status: 'DOI does not exist' }]]);
		const issues = await validatePubRelationshipsForDeposit(models.reviewPub.id);
		expect(issues).toEqual([expect.objectContaining({ type: 'internal_not_deposited' })]);
	});

	it("trusts the DOI registry when Crossref's API hasn't indexed a new DOI yet", async () => {
		const fetchMock = respond(404, [
			200,
			[{ DOI: '10.1162/99608f92.reviewed', RA: 'Crossref' }],
		]);
		expect(await validatePubRelationshipsForDeposit(models.reviewPub.id)).toEqual([]);
		expect(fetchMock.mock.calls[1][0]).toEqual('https://doi.org/ra/10.1162/99608f92.reviewed');
	});

	it('treats a DOI registered with another agency as not in Crossref', async () => {
		respond(404, [200, [{ DOI: '10.1162/99608f92.reviewed', RA: 'DataCite' }]]);
		const issues = await validatePubRelationshipsForDeposit(models.reviewPub.id);
		expect(issues).toEqual([expect.objectContaining({ type: 'internal_not_deposited' })]);
	});

	it("says it couldn't check when the DOI registry doesn't answer", async () => {
		respond(404, 503);
		const issues = await validatePubRelationshipsForDeposit(models.reviewPub.id);
		expect(issues).toEqual([
			expect.objectContaining({
				type: 'crossref_unreachable',
				message: expect.stringContaining("the DOI registry didn't answer"),
			}),
		]);
	});

	it("says it couldn't check when Crossref keeps failing", async () => {
		respond(503, 503, 503);
		const issues = await validatePubRelationshipsForDeposit(models.reviewPub.id);
		expect(issues).toEqual([
			expect.objectContaining({
				type: 'crossref_unreachable',
				message: expect.stringContaining('Crossref returned 503'),
			}),
		]);
	});
});
