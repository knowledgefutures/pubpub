const doiDataPaths = [
	['book', 'content_item'],
	['conference', 'conference_paper'],
	['journal', 'journal_article'],
	['posted_content'],
	['peer_review'],
	['sa_component', 'component_list', 'component'],
];

export const getDoiData = ({ doi_batch: { body } }) => {
	let i = 0;

	while (i < doiDataPaths.length) {
		const path = doiDataPaths[i];
		let visiting = body;
		let j = 0;

		while (j < path.length) {
			const key = path[j];
			visiting = visiting[key];

			if (!visiting) {
				break;
			}

			if (j === path.length - 1) {
				return visiting.doi_data;
			}

			j++;
		}

		i++;
	}

	return null;
};

export const getDepositRecordContentVersion = (depositRecord) => {
	if (!depositRecord || !depositRecord.depositJson) {
		return null;
	}

	const {
		depositJson: { deposit },
	} = depositRecord;
	const doiData = getDoiData(deposit);

	if (!doiData) {
		return null;
	}

	return doiData.resource['@content_version'];
};

export const setDepositRecordContentVersion = (depositRecord, contentVersion) => {
	if (!depositRecord || !depositRecord.depositJson) {
		return;
	}

	const {
		depositJson: { deposit },
	} = depositRecord;
	const doiData = getDoiData(deposit);

	if (!contentVersion) {
		delete doiData.resource['@content_version'];
	} else {
		doiData.resource['@content_version'] = contentVersion;
	}
};

export const getDepositRecordReviewType = (depositRecord) => {
	if (!depositRecord || !depositRecord.depositJson) {
		return null;
	}

	const {
		depositJson: {
			deposit: {
				doi_batch: { body },
			},
		},
	} = depositRecord;

	if (!('peer_review' in body)) {
		return null;
	}

	return body.peer_review['@type'];
};

// eslint-disable-next-line consistent-return
export function setDepositRecordReviewType(depositRecord, reviewType) {
	if (!depositRecord || !depositRecord.depositJson) {
		return null;
	}

	// eslint-disable-next-line no-param-reassign
	depositRecord.depositJson.deposit.doi_batch.body.peer_review['@type'] = reviewType;
}

export const getDepositRecordReviewRecommendation = (depositRecord) => {
	if (!depositRecord || !depositRecord.depositJson) {
		return null;
	}

	const {
		depositJson: {
			deposit: {
				doi_batch: { body },
			},
		},
	} = depositRecord;

	if (!('peer_review' in body)) {
		return null;
	}

	return body.peer_review['@recommendation'];
};

// eslint-disable-next-line consistent-return
export function setDepositRecordReviewRecommendation(depositRecord, recommendation) {
	if (!depositRecord || !depositRecord.depositJson) {
		return null;
	}

	// eslint-disable-next-line no-param-reassign
	depositRecord.depositJson.deposit.doi_batch.body.peer_review['@recommendation'] =
		recommendation;
}

export const getDepositBody = (depositRecord) => {
	if (!depositRecord || !depositRecord.depositJson) {
		return null;
	}

	return depositRecord.depositJson.deposit.doi_batch.body;
};

const createIsDeposit = (key) => (crossrefDepositRecord) => {
	const body = getDepositBody(crossrefDepositRecord);
	return crossrefDepositRecord && body && key in body;
};

export const isBookDeposit = createIsDeposit('book');
export const isJournalDeposit = createIsDeposit('journal');
export const isConferenceDeposit = createIsDeposit('conference');
export const isPreprintDeposit = createIsDeposit('posted_content');
export const isPeerReviewDeposit = createIsDeposit('peer_review');
export const isStandaloneComponentDeposit = createIsDeposit('sa_component');

export const getDepositTypeTitle = (crossrefDepositRecord) => {
	switch (true) {
		case isBookDeposit(crossrefDepositRecord):
			return 'Book Chapter';
		case isJournalDeposit(crossrefDepositRecord):
			return 'Journal Article';
		case isConferenceDeposit(crossrefDepositRecord):
			return 'Conference Proceeding';
		case isPreprintDeposit(crossrefDepositRecord):
			return 'Preprint';
		case isPeerReviewDeposit(crossrefDepositRecord):
			return 'Peer Review';
		case isStandaloneComponentDeposit(crossrefDepositRecord):
			return 'Supplement';
		default:
			return '';
	}
};
