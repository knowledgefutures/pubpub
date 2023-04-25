import isUrl from 'is-url';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Button,
	AnchorButton,
	InputGroup,
	Checkbox,
	Icon,
	MenuItem,
	Collapse,
	Spinner,
	Card,
} from '@blueprintjs/core';
import { useUpdateEffect } from 'react-use';
import { useDebounce } from 'use-debounce';

import { moveToEndOfSelection } from 'components/Editor';
import { usePubContext } from 'containers/Pub/pubHooks';
import { pubUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';
import { InboundEdge, OutboundEdge, Pub, PubEdge } from 'types';
import { apiFetch } from 'client/utils/apiFetch';
import { useDashboardEdges } from 'client/containers/DashboardEdges/useDashboardEdges';
import {
	createCandidateEdge,
	stripMarkupFromString,
} from 'containers/DashboardEdges/NewEdgeEditor';
import { assert } from 'utils/assert';
import { relationTypeDefinitions } from 'utils/pubEdge';
import { MenuButton } from 'client/components/Menu';
import { PubEdgeListingCard } from 'components';

require('./controlsLink.scss');

type Props = {
	editorChangeObject: {
		activeLink?: any;
		view?: any;
	};
	onClose: (...args: any[]) => any;
};

enum Status {
	LoadingEdge,
	EditingLink,
	EditingLinkExtra,
	FetchingEdgeProposal,
	EditingEdge,
	UpdatingEdge,
}

const isStatus = (status: Status, ...statuses: Status[]) => {
	return statuses.includes(status);
};

const ControlsLink = (props: Props) => {
	const {
		editorChangeObject: { activeLink, view },
		onClose,
	} = props;

	const { communityData } = usePageContext();
	const { inPub, pubData } = usePubContext();

	const [status, setStatus] = useState(Status.LoadingEdge);
	const [href, setHref] = useState(activeLink.attrs.href);
	const [debouncedHref] = useDebounce(href, 250);
	const [errorCreatingEdge, setErrorCreatingEdge] = useState<string>();
	const [errorUpdatingEdge, setErrorUpdatingEdge] = useState<string>();
	const [pubEdge, setPubEdge] = useState<PubEdge | null>(null);
	const { pubEdgeId } = activeLink.attrs;

	const inputRef = useRef();

	const { addCreatedOutboundEdge, removeOutboundEdge, updateOutboundEdge } = useDashboardEdges(
		pubData as Pub & { outboundEdges: OutboundEdge[]; inboundEdges: InboundEdge[] },
	);

	const setHashOrUrl = (value: string) => {
		if (inPub) {
			const basePubUrl = pubUrl(communityData, pubData);
			const hashMatches = value.match(`^${basePubUrl}(.*)?#(.*)$`);
			setHref(hashMatches ? `#${hashMatches[2]}` : value);
		}
		setHref(value);
	};

	useEffect(() => {
		if (status !== Status.LoadingEdge) return;
		if (pubEdgeId) {
			apiFetch
				.get(`/api/pubEdges/${pubEdgeId}`)
				.then((res) => {
					setPubEdge(res);
					setStatus(Status.EditingEdge);
				})
				.catch(() => {
					setPubEdge(null);
					activeLink.updateAttrs({ pubEdgeId: null });
					setStatus(Status.EditingLink);
				});
		} else {
			setStatus(Status.EditingLink);
		}
	}, [status, pubEdgeId, activeLink]);

	useUpdateEffect(() => activeLink.updateAttrs({ href: debouncedHref }), [debouncedHref]);

	useEffect(() => {
		// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
		if (inputRef.current && typeof inputRef.current.focus === 'function' && !href) {
			// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
			inputRef.current.focus();
		}
	}, [href]);

	const restoreSelection = useCallback(() => {
		view.focus();
		moveToEndOfSelection(view);
	}, [view]);

	const handleKeyPress = (evt) => {
		if (evt.key === 'Enter') {
			activeLink.updateAttrs({ href });
			onClose();
			setTimeout(restoreSelection, 0);
		}
	};

	const checkedOpenInNewTab = activeLink.attrs.target === '_blank';

	const toggleOpenInNewTab = () => {
		activeLink.updateAttrs({
			target: activeLink.attrs.target === '_blank' ? '_self' : '_blank',
		});
	};

	const createConnection = (edge: PubEdge) => {
		setStatus(Status.UpdatingEdge);
		apiFetch
			.post('/api/pubEdges', {
				...edge,
				pubId: pubData.id,
				// Don't send the whole Pub, just the ID
				targetPub: undefined,
			})
			.then((createdEdge: OutboundEdge) => {
				addCreatedOutboundEdge(createdEdge);
				activeLink.updateAttrs({ pubEdgeId: createdEdge.id });
				setPubEdge(createdEdge);
			})
			.catch((err: Error) => {
				setErrorCreatingEdge(err.message);
			})
			.finally(() => {
				setStatus(Status.EditingEdge);
			});
	};

	const handleCreateEdge = () => {
		assert(pubEdge !== null);
		if (!activeLink.attrs.pubEdgeId) {
			createConnection(pubEdge);
		} else if (pubEdge) {
			setStatus(Status.UpdatingEdge);
			apiFetch
				.put('/api/pubEdges', {
					pubEdgeId: activeLink.attrs.pubEdgeId,
					pubIsParent: pubEdge.pubIsParent,
					relationType: pubEdge.relationType,
				})
				.then((updatedEdge: OutboundEdge) => {
					updateOutboundEdge(updatedEdge);
					setPubEdge(updatedEdge);
				})
				.catch((err) => {
					setErrorUpdatingEdge(err.message);
				})
				.finally(() => {
					setStatus(Status.EditingEdge);
				});
		}
	};

	const togglePubEdge = async () => {
		if (isStatus(status, Status.EditingEdge)) {
			if (activeLink.attrs.pubEdgeId) {
				activeLink.updateAttrs({ pubEdgeId: null });
				removeOutboundEdge(pubEdge);
				setPubEdge(null);
			}
			setStatus(Status.EditingLinkExtra);
		} else if (isStatus(status, Status.EditingLinkExtra) && isUrl(href)) {
			try {
				setStatus(Status.FetchingEdgeProposal);
				const pubEdgeProposal = await apiFetch.get(
					`/api/pubEdgeProposal?object=${encodeURIComponent(href)}`,
				);
				if ('targetPub' in pubEdgeProposal && pubEdgeProposal.targetPub) {
					setPubEdge(
						createCandidateEdge({
							targetPub: pubEdgeProposal.targetPub,
							targetPubId: pubEdgeProposal.targetPub.id,
						}),
					);
				} else if (
					'externalPublication' in pubEdgeProposal &&
					pubEdgeProposal.externalPublication
				) {
					setPubEdge(
						createCandidateEdge({
							externalPublication: {
								...pubEdgeProposal.externalPublication,
								description: stripMarkupFromString(
									pubEdgeProposal.externalPublication.description,
								),
							},
						}),
					);
				}
				setStatus(Status.EditingEdge);
			} catch (error) {
				setStatus(Status.EditingLinkExtra);
			}
		}
	};

	const handleDirection = () => {
		assert(pubEdge != null);
		setPubEdge({
			...pubEdge,
			pubIsParent: !pubEdge.pubIsParent,
		});
	};

	const handleEdgeRelationTypeChange = (relationType: string) => {
		assert(pubEdge != null);
		setPubEdge({
			...pubEdge,
			relationType,
		});
	};

	const currentRelationName =
		pubEdge &&
		relationTypeDefinitions[pubEdge.relationType] &&
		relationTypeDefinitions[pubEdge.relationType].name;

	const renderRelationshipButton = () => (
		<MenuButton
			aria-label="Select relationship type"
			buttonProps={{
				rightIcon: 'chevron-down',
				// @ts-expect-error ts-migrate(2322) FIXME: Type '{ rightIcon: string; children: string; }' is... Remove this comment to see the full error message
				children: `${currentRelationName}`,
			}}
			className="buttons"
			minimal
		>
			{Object.entries(relationTypeDefinitions).map(([relationType, definition]) => {
				const { name } = definition;
				assert(pubEdge != null);
				const selected = pubEdge.relationType === relationType;
				return (
					<MenuItem
						text={name}
						onClick={() => handleEdgeRelationTypeChange(relationType)}
						key={relationType}
						icon={selected ? 'tick' : 'blank'}
					/>
				);
			})}
		</MenuButton>
	);

	const ControlsLinkExtra = () => {
		return (
			<div className="connection">
				<Checkbox
					label="Open in new tab"
					checked={checkedOpenInNewTab}
					onChange={toggleOpenInNewTab}
				/>
				<Checkbox
					label={errorCreatingEdge || 'Create a Pub Connection for this URL'}
					onChange={togglePubEdge}
					checked={isStatus(
						status,
						Status.FetchingEdgeProposal,
						Status.EditingEdge,
						Status.UpdatingEdge,
					)}
					disabled={
						isStatus(status, Status.FetchingEdgeProposal, Status.UpdatingEdge) ||
						!isUrl(href)
					}
				/>
				{isStatus(status, Status.FetchingEdgeProposal) && <Spinner />}
				{isStatus(status, Status.EditingEdge, Status.UpdatingEdge) && (
					<>
						<div className="controls-col">
							<div className="control-row">
								<div>Type: {renderRelationshipButton()}</div>
								<div>
									Direction:{' '}
									<Button icon="swap-vertical" minimal onClick={handleDirection}>
										{pubEdge && pubEdge.pubIsParent
											? 'Parent → Child'
											: 'Child → Parent'}
									</Button>
								</div>
							</div>
						</div>
						<div className="preview">
							<Icon icon="info-sign" /> Preview &nbsp;
						</div>
						<div className="controls-link-pub-edge">
							<Card>
								<PubEdgeListingCard
									inPubBody
									isInboundEdge={false}
									pubEdge={pubEdge}
									pubEdgeDescriptionIsVisible={false}
									showIcon
								/>
							</Card>
						</div>
						<div className="control-row">
							<div className="save-button">
								<Button
									title="Save Connection"
									minimal
									icon="tick"
									onClick={handleCreateEdge}
								>
									{isStatus(status, Status.UpdatingEdge) ? (
										<Spinner size={16} />
									) : (
										'Save Connection' || errorUpdatingEdge
									)}
								</Button>
							</div>
						</div>
					</>
				)}
			</div>
		);
	};

	const handleDestroyUsAll = () => {
		if (activeLink.attrs.pubEdgeId) {
			activeLink.updateAttrs({ pubEdgeId: null });
			removeOutboundEdge(pubEdge);
			setPubEdge(null);
			setStatus(Status.EditingLinkExtra);
		}
		activeLink.removeLink();
	};

	return (
		<div className="controls-link-component">
			<InputGroup
				placeholder="Enter a URL"
				value={href}
				onChange={(evt) => setHashOrUrl(evt.target.value)}
				onKeyPress={handleKeyPress}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'MutableRefObject<undefined>' is not assignab... Remove this comment to see the full error message
				inputRef={inputRef}
			/>
			<div className="actions">
				<AnchorButton
					small
					minimal
					title="Options"
					icon={
						isStatus(
							status,
							Status.EditingLinkExtra,
							Status.EditingEdge,
							Status.UpdatingEdge,
						)
							? 'chevron-up'
							: 'chevron-down'
					}
					onClick={() =>
						setStatus(
							isStatus(status, Status.EditingLinkExtra, Status.EditingEdge)
								? Status.EditingLink
								: pubEdge != null
								? Status.EditingEdge
								: Status.EditingLinkExtra,
						)
					}
					disabled={isStatus(status, Status.UpdatingEdge)}
				>
					OPTIONS
				</AnchorButton>
				<div className="actions-left">
					<Button
						small
						minimal
						title="Remove"
						icon="disable"
						onClick={handleDestroyUsAll}
					>
						REMOVE
					</Button>
					<AnchorButton
						small
						minimal
						title="Visit URL"
						icon="share"
						href={href}
						target="_blank"
						className="visit"
					>
						VISIT URL
					</AnchorButton>
				</div>
			</div>
			<Collapse
				isOpen={isStatus(
					status,
					Status.EditingLinkExtra,
					Status.FetchingEdgeProposal,
					Status.EditingEdge,
					Status.UpdatingEdge,
				)}
				keepChildrenMounted
			>
				<ControlsLinkExtra />
			</Collapse>
		</div>
	);
};

export default ControlsLink;
