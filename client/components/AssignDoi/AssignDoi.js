import React, { useReducer, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button, Callout } from '@blueprintjs/core';
import pickBy from 'lodash.pickby';

import { InputField, Menu, MenuItem, DropdownButton, MenuButton } from 'components';
import {
	getDepositRecordContentVersion,
	setDepositRecordContentVersion,
	getDepositRecordReviewType,
	setDepositRecordReviewType,
	getDepositRecordReviewRecommendation,
	setDepositRecordReviewRecommendation,
	isPreprintDeposit,
	isPeerReviewDeposit,
	isStandaloneComponentDeposit,
	getDepositTypeTitle,
} from 'utils/crossref/parseDeposit';
import { apiFetch } from 'client/utils/apiFetch';

import AssignDoiPreview from './AssignDoiPreview';

require('./assignDoi.scss');

const noop = () => {};

const propTypes = {
	communityData: PropTypes.object.isRequired,
	disabled: PropTypes.bool,
	onDeposit: PropTypes.func,
	onError: PropTypes.func,
	onPreview: PropTypes.func,
	pubData: PropTypes.object.isRequired,
	target: PropTypes.string.isRequired,
};

const defaultProps = {
	disabled: false,
	onDeposit: noop,
	onError: noop,
	onPreview: noop,
};

const AssignDoiStatus = {
	Initial: 'initial',
	Previewing: 'previewing',
	Previewed: 'previewed',
	Depositing: 'depositing',
	Deposited: 'deposited',
};

const AssignDoiActionType = {
	FetchPreview: 'fetch_preview',
	FetchPreviewSuccess: 'fetch_preview_success',
	UpdateContentVersion: 'update_content_version',
	UpdateReviewType: 'update_review_type',
	UpdateReviewRecommendation: 'update_review_recommendation',
	FetchDeposit: 'fetch_deposit',
	FetchDepositSuccess: 'fetch_deposit_success',
	Error: 'error',
};

const buttonTextByStatus = {
	[AssignDoiStatus.Initial]: 'Deposit to Crossref',
	[AssignDoiStatus.Previewing]: 'Getting Preview',
	[AssignDoiStatus.Previewed]: 'Submit Deposit',
	[AssignDoiStatus.Depositing]: 'Depositing',
	[AssignDoiStatus.Deposited]: 'DOI Deposited',
};

const getButtonText = (status, deposit) => {
	if (status === AssignDoiStatus.Initial && deposit) {
		return 'Resubmit DOI deposit';
	}

	return buttonTextByStatus[status];
};

export function reducer(state, action) {
	switch (action.type) {
		case AssignDoiActionType.FetchPreview:
			if (
				!(
					state.status === AssignDoiStatus.Initial ||
					state.status === AssignDoiStatus.Error ||
					// re-fetch preview
					state.status === AssignDoiStatus.Previewed
				)
			) {
				return state;
			}

			return {
				...state,
				status: AssignDoiStatus.Previewing,
				error: null,
			};
		case AssignDoiActionType.FetchPreviewSuccess:
			if (state.status !== AssignDoiStatus.Previewing) {
				return state;
			}

			return {
				...state,
				status: AssignDoiStatus.Previewed,
				crossrefDepositRecord: action.payload,
				error: null,
			};
		case AssignDoiActionType.UpdateContentVersion: {
			if (state.status !== AssignDoiStatus.Previewed) {
				return state;
			}

			const crossrefDepositRecord = { ...state.crossrefDepositRecord };

			// Not totally necessary here to create a full deep copy of the
			// object since we're not using a change detection algorithm
			// like `react-redux`, but this is technically a "Bad Practice":
			setDepositRecordContentVersion(crossrefDepositRecord, action.payload);

			return {
				...state,
				crossrefDepositRecord: crossrefDepositRecord,
			};
		}
		case AssignDoiActionType.UpdateReviewType: {
			if (state.status !== AssignDoiStatus.Previewed) {
				return state;
			}

			const crossrefDepositRecord = { ...state.crossrefDepositRecord };

			setDepositRecordReviewType(crossrefDepositRecord, action.payload);

			return {
				...state,
				crossrefDepositRecord: crossrefDepositRecord,
			};
		}
		case AssignDoiActionType.UpdateReviewRecommendation: {
			if (state.status !== AssignDoiStatus.Previewed) {
				return state;
			}

			const crossrefDepositRecord = { ...state.crossrefDepositRecord };

			setDepositRecordReviewRecommendation(crossrefDepositRecord, action.payload);

			return {
				...state,
				crossrefDepositRecord: crossrefDepositRecord,
			};
		}
		case AssignDoiActionType.FetchDeposit:
			if (state.status !== AssignDoiStatus.Previewed) {
				return state;
			}

			return {
				...state,
				status: AssignDoiStatus.Depositing,
				error: null,
			};
		case AssignDoiActionType.FetchDepositSuccess:
			if (state.status !== AssignDoiStatus.Depositing) {
				return state;
			}

			return {
				...state,
				status: AssignDoiStatus.Deposited,
				crossrefDepositRecord: action.payload,
				error: null,
			};
		case AssignDoiActionType.Error:
			return {
				...state,
				status: AssignDoiStatus.Initial,
				error: action.payload,
			};
		default:
			return state;
	}
}

const initialState = {
	status: AssignDoiStatus.Initial,
	preview: null,
	crossrefDepositRecord: null,
	error: null,
};

const contentVersionItems = [
	{ title: '(None)', key: 'none' },
	{ title: 'Preprint', key: 'preprint' },
	{ title: 'Advance Manuscript', key: 'am' },
	{ title: 'Version of Record', key: 'vor' },
];

const reviewTypeItems = [
	{ title: '(None)', key: 'none' },
	{ title: 'Referee Report', key: 'referee-report' },
	{ title: 'Editor Report', key: 'editor-report' },
	{ title: 'Author Comment', key: 'author-comment' },
	{ title: 'Community Comment', key: 'community-comment' },
	{ title: 'Manuscript', key: 'manuscript' },
	{ title: 'Aggregate', key: 'aggregate' },
	{ title: 'Recommendation', key: 'recommendation' },
];

const reviewRecommendationItems = [
	{ title: '(None)', key: 'none' },
	{ title: 'Major Revision', key: 'major-revision' },
	{ title: 'Minor Revision', key: 'minor-revision' },
	{ title: 'Reject', key: 'reject' },
	{ title: 'Reject with Resubmit', key: 'reject-with-resubmit' },
	{ title: 'Accept', key: 'accept' },
	{ title: 'Accept with Reservation', key: 'accept-with-reservation' },
];

const pickNonNullValues = (obj) => pickBy(obj, (value) => value !== null && value !== undefined);

function AssignDoi(props) {
	const { communityData, disabled, pubData, onPreview, onDeposit, onError, target } = props;
	const [state, dispatch] = useReducer(reducer, {
		...initialState,
		crossrefDepositRecord: pubData.crossrefDepositRecord,
	});
	const { status, crossrefDepositRecord, error } = state;

	const reviewType = getDepositRecordReviewType(crossrefDepositRecord);
	const reviewRecommendation = getDepositRecordReviewRecommendation(crossrefDepositRecord);

	let contentVersion = getDepositRecordContentVersion(crossrefDepositRecord);

	// Assume preprint if no content version is present and body consists of posted_content.
	if (!contentVersion && isPreprintDeposit(crossrefDepositRecord)) {
		contentVersion = 'preprint';
	}

	const activeContentVersionKey = contentVersion || 'none';
	const activeContentVersionItem = contentVersionItems.find(
		(item) => item.key === activeContentVersionKey,
	);

	const activeReviewTypeKey = reviewType || 'none';
	const activeReviewTypeItem = reviewTypeItems.find((item) => item.key === activeReviewTypeKey);

	const activeReviewRecommendationKey = reviewRecommendation || 'none';
	const activeReviewRecommendationItem = reviewRecommendationItems.find(
		(item) => item.key === activeReviewRecommendationKey,
	);

	const requestBody = {
		target: target,
		pubId: pubData.id,
		communityId: communityData.id,
		contentVersion: contentVersion,
		reviewType: reviewType,
		reviewRecommendation: reviewRecommendation,
	};

	const fetchPreview = async (nextParams) => {
		dispatch({ type: AssignDoiActionType.FetchPreview });

		try {
			const params = new URLSearchParams(
				pickNonNullValues({
					...requestBody,
					...nextParams,
				}),
			);
			const preview = await apiFetch(`/api/doiPreview?${params.toString()}`);

			onPreview(preview);

			dispatch({
				type: AssignDoiActionType.FetchPreviewSuccess,
				payload: preview,
			});
		} catch (err) {
			dispatch({ type: AssignDoiActionType.Error, payload: err.message });
			onError(err);
		}
	};

	const fetchDeposit = async () => {
		dispatch({ type: AssignDoiActionType.FetchDeposit });

		try {
			const body = JSON.stringify(pickNonNullValues(requestBody));
			const response = await apiFetch('/api/doi', {
				method: 'POST',
				body: body,
			});
			dispatch({
				type: AssignDoiActionType.FetchDepositSuccess,
				payload: { depositJson: response },
			});

			onDeposit(response.dois[target]);
		} catch (err) {
			dispatch({ type: AssignDoiActionType.Error, payload: err.message });
			onError(err);
		}
	};

	const handlePreviewClick = () => fetchPreview();
	const handleDepositClick = () => fetchDeposit();
	const handleContentVersionItemSelect = ({ key }) => {
		const nextContentVersion = key === 'none' ? null : key;

		dispatch({
			type: AssignDoiActionType.UpdateContentVersion,
			payload: nextContentVersion,
		});

		// Immediately load preview with next content version.
		fetchPreview({ contentVersion: nextContentVersion });
	};
	const handleReviewTypeItemSelect = ({ key }) => {
		const nextReviewType = key === 'none' ? null : key;

		dispatch({
			type: AssignDoiActionType.UpdateReviewType,
			payload: nextReviewType,
		});

		// Immediately load preview with next review type.
		fetchPreview({ reviewType: nextReviewType });
	};
	const handleReviewRecommendationItemSelect = ({ key }) => {
		const nextReviewRecommendation = key === 'none' ? null : key;

		dispatch({
			type: AssignDoiActionType.UpdateReviewRecommendation,
			payload: nextReviewRecommendation,
		});

		// Immediately load preview with next review recommendation.
		fetchPreview({ reviewRecommendation: nextReviewRecommendation });
	};

	let handleButtonClick;

	if (status === AssignDoiStatus.Initial) {
		handleButtonClick = handlePreviewClick;
	} else if (status === AssignDoiStatus.Previewed) {
		handleButtonClick = handleDepositClick;
	}

	const priorPubDoi = useRef(pubData.doi);

	// Re-load the preview when the Pub's DOI changes.
	useEffect(() => {
		if (priorPubDoi.current !== pubData.doi && status === AssignDoiStatus.Previewed) {
			fetchPreview();
		}
		priorPubDoi.current = pubData.doi;
	}, [pubData.doi, status]);

	return (
		<div className="assign-doi-component">
			{(status === AssignDoiStatus.Previewed || status === AssignDoiStatus.Previewing) && (
				<>
					<Callout intent="primary" title="Review Deposit">
						This work is being deposited as a{' '}
						<strong>{getDepositTypeTitle(crossrefDepositRecord) || '...'}</strong> based
						on its Connections, primary collection, or selected Content Version. Review
						the information below, then click the "Submit Deposit" button to submit the
						deposit to Crossref.
					</Callout>

					{!isStandaloneComponentDeposit(crossrefDepositRecord) && (
						<InputField label="Content Version">
							<MenuButton
								buttonContent={activeContentVersionItem.title}
								buttonProps={{ rightIcon: 'caret-down' }}
								aria-label="content-version"
							>
								{contentVersionItems.map((item) => (
									<MenuItem
										key={item.key}
										active={item === activeContentVersionItem}
										onClick={() => handleContentVersionItemSelect(item)}
										text={item.title}
									/>
								))}
							</MenuButton>
						</InputField>
					)}

					{isPeerReviewDeposit(crossrefDepositRecord) && (
						<div className="dropdowns">
							<InputField label="Review Type">
								<MenuButton
									buttonContent={activeReviewTypeItem.title}
									buttonProps={{ rightIcon: 'caret-down' }}
									aria-label="review-type"
								>
									{reviewTypeItems.map((item) => (
										<MenuItem
											key={item.key}
											active={item === activeReviewTypeItem}
											onClick={() => handleReviewTypeItemSelect(item)}
											text={<span>{item.title}</span>}
										/>
									))}
								</MenuButton>
							</InputField>
							<InputField label="Review Recommendation">
								<MenuButton
									buttonContent={activeReviewRecommendationItem.title}
									buttonProps={{ rightIcon: 'caret-down' }}
									aria-label="review-type"
								>
									{reviewRecommendationItems.map((item) => (
										<MenuItem
											key={item.key}
											active={item === activeReviewRecommendationItem}
											onClick={() =>
												handleReviewRecommendationItemSelect(item)
											}
											text={<span>{item.title}</span>}
										/>
									))}
								</MenuButton>
							</InputField>
						</div>
					)}
				</>
			)}
			{status === AssignDoiStatus.Previewed && (
				<AssignDoiPreview crossrefDepositRecord={crossrefDepositRecord} />
			)}
			<InputField error={error && 'There was an error depositing the work.'}>
				<Button
					disabled={disabled || !handleButtonClick}
					text={getButtonText(status, pubData.crossrefDepositRecord)}
					loading={
						status === AssignDoiStatus.Previewing ||
						status === AssignDoiStatus.Depositing
					}
					onClick={handleButtonClick}
					icon={status === AssignDoiStatus.Deposited && 'tick'}
				/>
			</InputField>
		</div>
	);
}

AssignDoi.propTypes = propTypes;
AssignDoi.defaultProps = defaultProps;
export default AssignDoi;
