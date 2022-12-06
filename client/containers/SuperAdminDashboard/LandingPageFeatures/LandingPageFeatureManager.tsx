import React, { useCallback, useState } from 'react';
import { Button, InputGroup } from '@blueprintjs/core';

import { DragDropOrdering, Icon } from 'components';
import { LandingPageFeatureKind, LandingPageFeatureOfKind } from 'types';
import { apiFetch } from 'client/utils/apiFetch';
import { findRankInRankedList } from 'utils/rank';

require('./landingPageFeatureManager.scss');

export type RenderFeatureProps<Kind extends LandingPageFeatureKind> = {
	feature: LandingPageFeatureOfKind<Kind>;
	onUpdateFeature: (feature: LandingPageFeatureOfKind<Kind>) => unknown;
};

type Props<Kind extends LandingPageFeatureKind> = {
	kind: Kind;
	initialFeatures: LandingPageFeatureOfKind<Kind>[];
	renderFeature: (props: RenderFeatureProps<Kind>) => React.ReactNode;
	placeholder: string;
};

const LandingPageFeatureManager = <Kind extends LandingPageFeatureKind>(props: Props<Kind>) => {
	const { initialFeatures, renderFeature, placeholder, kind } = props;
	const [featureInputValue, setFeatureInputValue] = useState('');
	const [inputHasError, setInputHasError] = useState(false);
	const [features, setFeatures] = useState(initialFeatures);

	const handleAddFeature = useCallback(async () => {
		try {
			const newFeature = await apiFetch.post('/api/landingPageFeatures', {
				proposal: featureInputValue,
				proposalKind: kind,
				rank: findRankInRankedList(features, 0),
			});
			setFeatures([newFeature, ...features]);
		} catch (_) {
			setInputHasError(true);
		} finally {
			setFeatureInputValue('');
		}
	}, [featureInputValue, kind, features]);

	const handleUpdateFeature = useCallback((nextFeature: LandingPageFeatureOfKind<Kind>) => {
		setFeatures((currentFeatures) => {
			return currentFeatures.map((f) => {
				if (f.id === nextFeature.id) {
					return nextFeature;
				}
				return f;
			});
		});
		// Wants type Kind as a dep
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleRemoveFeature = useCallback(
		async (featureId: string) => {
			setFeatures(features.filter((f) => f.id !== featureId));
			try {
				await apiFetch.delete('/api/landingPageFeatures', {
					landingPageFeature: {
						id: featureId,
					},
				});
			} catch (_) {
				setFeatures(features);
			}
		},
		[features],
	);

	const handleReorderFeatures = useCallback(
		async (
			nextFeatures: LandingPageFeatureOfKind<Kind>[],
			reorderedFeature: LandingPageFeatureOfKind<Kind>,
			reorderedToIndex: number,
		) => {
			setFeatures(nextFeatures);
			const rank = findRankInRankedList(
				nextFeatures.filter((f) => f.id !== reorderedFeature.id),
				reorderedToIndex,
			);
			try {
				await apiFetch.put('/api/landingPageFeatures', {
					landingPageFeature: {
						id: reorderedFeature.id,
						rank,
					},
				});
			} catch (_) {
				setFeatures(features);
			}
		},
		// Wants type Kind as a dep
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[features],
	);

	const handleInputKeyDown = useCallback(
		(e: any) => {
			setInputHasError(false);
			if (e.key === 'Enter') {
				handleAddFeature();
			}
		},
		[handleAddFeature],
	);

	const renderFeatureFrame = (feature: LandingPageFeatureOfKind<Kind>, dragHandleProps: any) => {
		return (
			<div className="feature-wrapper">
				{dragHandleProps && (
					<span className="drag-handle" {...dragHandleProps}>
						<Icon icon="drag-handle-vertical" />
					</span>
				)}
				<div className="feature-content">
					{renderFeature({ feature, onUpdateFeature: handleUpdateFeature })}
				</div>
				<Button
					className="close-button"
					minimal
					icon="cross"
					onClick={() => handleRemoveFeature(feature.id)}
				/>
			</div>
		);
	};

	return (
		<div className="landing-page-feature-manager-component">
			<InputGroup
				large
				className="main-input"
				intent={inputHasError ? 'danger' : 'none'}
				placeholder={placeholder}
				onKeyDown={handleInputKeyDown}
				value={featureInputValue}
				onChange={(e) => setFeatureInputValue(e.target.value)}
				rightElement={<Button minimal large icon="add" onClick={handleAddFeature} />}
			/>
			<DragDropOrdering
				withDragHandles
				items={features}
				onReorderItems={handleReorderFeatures}
				droppableType={kind}
				renderItem={renderFeatureFrame}
			/>
		</div>
	);
};

export default LandingPageFeatureManager;
