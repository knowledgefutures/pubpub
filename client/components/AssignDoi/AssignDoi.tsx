import React, { useCallback, useReducer, useEffect, useMemo, useRef } from 'react';
import { Button, Callout } from '@blueprintjs/core';
import pickBy from 'lodash.pickby';

import { InputField, MenuItem, MenuButton } from 'components';
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

type OwnProps = {
	communityData: any;
	disabled?: boolean;
	onDeposit?: (...args: any[]) => any;
	onError?: (...args: any[]) => any;
	onPreview?: (...args: any[]) => any;
	pubData: any;
	target: string;
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
					// @ts-expect-error ts-migrate(2339) FIXME: Property 'Error' does not exist on type '{ Initial... Remove this comment to see the full error message
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

type Props = OwnProps & typeof defaultProps;

function AssignDoi(props: Props) {
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

	const requestBody = useMemo(
		() => ({
			target: target,
			pubId: pubData.id,
			communityId: communityData.id,
			contentVersion: contentVersion,
			reviewType: reviewType,
			reviewRecommendation: reviewRecommendation,
		}),
		[target, pubData, communityData, contentVersion, reviewType, reviewRecommendation],
	);

	const fetchPreview = useCallback(
		async (nextParams) => {
			dispatch({ type: AssignDoiActionType.FetchPreview });

			try {
				const params = new URLSearchParams(
					pickNonNullValues({
						...requestBody,
						...nextParams,
					}),
				);
				// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
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
		},
		[requestBody, onPreview, onError],
	);

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

	// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
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
			// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
			fetchPreview();
		}
		priorPubDoi.current = pubData.doi;
	}, [pubData.doi, status, fetchPreview]);

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
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'null | un... Remove this comment to see the full error message
								buttonContent={activeContentVersionItem.title}
								// @ts-expect-error ts-migrate(2322) FIXME: Object literal may only specify known properties, ... Remove this comment to see the full error message
								buttonProps={{ rightIcon: 'caret-down' }}
								aria-label="content-version"
							>
								{contentVersionItems.map((item) => (
									<MenuItem
										key={item.key}
										// @ts-expect-error ts-migrate(2322) FIXME: Property 'active' does not exist on type 'Intrinsi... Remove this comment to see the full error message
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
									// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'null | un... Remove this comment to see the full error message
									buttonContent={activeReviewTypeItem.title}
									// @ts-expect-error ts-migrate(2322) FIXME: Object literal may only specify known properties, ... Remove this comment to see the full error message
									buttonProps={{ rightIcon: 'caret-down' }}
									aria-label="review-type"
								>
									{reviewTypeItems.map((item) => (
										<MenuItem
											key={item.key}
											// @ts-expect-error ts-migrate(2322) FIXME: Property 'active' does not exist on type 'Intrinsi... Remove this comment to see the full error message
											active={item === activeReviewTypeItem}
											onClick={() => handleReviewTypeItemSelect(item)}
											text={<span>{item.title}</span>}
										/>
									))}
								</MenuButton>
							</InputField>
							<InputField label="Review Recommendation">
								<MenuButton
									// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'null | un... Remove this comment to see the full error message
									buttonContent={activeReviewRecommendationItem.title}
									// @ts-expect-error ts-migrate(2322) FIXME: Object literal may only specify known properties, ... Remove this comment to see the full error message
									buttonProps={{ rightIcon: 'caret-down' }}
									aria-label="review-type"
								>
									{reviewRecommendationItems.map((item) => (
										<MenuItem
											key={item.key}
											// @ts-expect-error ts-migrate(2322) FIXME: Property 'active' does not exist on type 'Intrinsi... Remove this comment to see the full error message
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
AssignDoi.defaultProps = defaultProps;
export default AssignDoi;
