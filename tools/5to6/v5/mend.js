/* eslint-disable no-restricted-syntax */
const { storage } = require('../setup');
const { getChangesForPub } = require('./changes');
const reconstructDocument = require('./reconstructDocument');
const { jsonToDoc, docToString } = require('../util/docUtils');

const firstVersionAfterTime = (timestamp, versions) => {
	const date = new Date(timestamp);
	const validVersions = versions
		.filter((version) => new Date(version.createdAt) >= date)
		.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
	return validVersions[0];
};

const changesBackwardsFromTime = (timestamp, changes) => {
	const date = new Date(timestamp);
	return changes
		.filter((change) => new Date(change.timestamp) <= date)
		.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const invertDocumentWithChanges = (startingDoc, changesToInvert, targetDoc) => {
	let invertingDoc = startingDoc;
	for (const changeToInvert of changesToInvert) {
		for (const stepToInvert of changeToInvert.steps.reverse()) {
			const invertedStep = stepToInvert.invert(invertingDoc);
			const { doc, failed } = invertedStep.apply(invertingDoc);
			if (failed) {
				throw new Error(failed);
			}
			invertingDoc = doc;
			if (docToString(invertingDoc) === docToString(targetDoc)) {
				return invertingDoc;
			}
		}
	}
	return null;
};

const mend = (pubId) => {
	const pubDir = storage.within(`pubs/${pubId}`);
	const pubModel = JSON.parse(pubDir.read('model.json'));
	const changes = getChangesForPub(pubDir);
	let lastGoodState;
	try {
		for (lastGoodState of reconstructDocument(changes));
	} catch (e) {
		const referenceVersion = firstVersionAfterTime(
			lastGoodState.change.timestamp,
			pubModel.versions,
		);
		if (referenceVersion) {
			const referenceDoc = jsonToDoc(
				Array.isArray(referenceVersion.content)
					? referenceVersion.content[0]
					: referenceVersion.content,
			);
			const changesToInvert = changesBackwardsFromTime(
				new Date(referenceVersion.createdAt).getTime() + 0 * 60,
				changes,
			);
			let successfullyInvertedDocument = null;
			for (let i = 0; i < changesToInvert.length; i += 1) {
				const subChanges = changesToInvert.slice(i);
				try {
					const invertedResult = invertDocumentWithChanges(
						referenceDoc,
						subChanges,
						lastGoodState.doc,
					);
					if (invertedResult) {
						successfullyInvertedDocument = invertedResult;
						break;
					}
				} catch (err) {
					// nope
				}
			}
			// eslint-disable-next-line no-console
			console.log(successfullyInvertedDocument);
		}
	}
};

const main = () => {
	const pubId = process.argv[2];
	mend(pubId);
};

main();
