import type { CommunityTemplate } from 'types';

import React, { useState } from 'react';

import { Button, Icon, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

import './templatePicker.scss';

export const CLONE_MARKER = '__clone__';

type HubCommunityOption = {
	id: string;
	title: string;
	subdomain: string;
	avatar?: string | null;
};

type Props = {
	templates: CommunityTemplate[];
	selectedTemplateId: string | null;
	onSelect: (templateId: string | null) => void;
	hubCommunities: HubCommunityOption[];
	cloneEnabled: boolean;
	cloneCommunityId: string | null;
	onCloneCommunitySelect: (communityId: string | null) => void;
};

type TemplateOption = {
	id: string | null;
	title: string;
	description: string | null;
	avatar: string | null;
};

const INITIAL_VISIBLE = 6;

const CommunitySelect = Select.ofType<HubCommunityOption>();

const TemplatePicker = ({
	templates,
	selectedTemplateId,
	onSelect,
	hubCommunities,
	cloneEnabled,
	cloneCommunityId,
	onCloneCommunitySelect,
}: Props) => {
	const [showAll, setShowAll] = useState(false);

	const options: TemplateOption[] = [
		{
			id: null,
			title: 'Blank Community',
			description: 'Start from scratch with a single welcome page.',
			avatar: null,
		},
		...templates.map((t) => ({
			id: t.id,
			title: t.title,
			description: t.description,
			avatar: t.avatar,
		})),
	];

	const visibleOptions = showAll ? options : options.slice(0, INITIAL_VISIBLE);
	const hasMore = options.length > INITIAL_VISIBLE;
	const isCloneSelected = selectedTemplateId === CLONE_MARKER;
	const selectedCommunity = hubCommunities.find((c) => c.id === cloneCommunityId) || null;

	return (
		<div className="template-picker-cards">
			<div className="template-picker-cards-label">Choose a starting template</div>
			<div className="template-picker-cards-grid">
				{visibleOptions.map((option) => {
					const isSelected = !isCloneSelected && option.id === selectedTemplateId;
					return (
						<button
							key={option.id ?? 'blank'}
							type="button"
							className={`template-card${isSelected ? ' selected' : ''}`}
							onClick={() => onSelect(option.id)}
						>
							<div className="template-card-icon">
								{option.avatar ? (
									<img src={option.avatar} alt="" />
								) : (
									<Icon
										icon={option.id === null ? 'document' : 'layout-grid'}
										iconSize={24}
									/>
								)}
							</div>
							<div className="template-card-body">
								<div className="template-card-title">{option.title}</div>
								{option.description && (
									<div className="template-card-desc">
										{option.description.length > 80
											? `${option.description.slice(0, 80)}…`
											: option.description}
									</div>
								)}
							</div>
							<div className="template-card-radio">
								<div className={`radio-dot${isSelected ? ' checked' : ''}`} />
							</div>
						</button>
					);
				})}
				{cloneEnabled && hubCommunities.length > 0 && (
					<button
						type="button"
						className={`template-card${isCloneSelected ? ' selected' : ''}`}
						onClick={() => onSelect(CLONE_MARKER)}
					>
						<div className="template-card-icon">
							<Icon icon="duplicate" iconSize={24} />
						</div>
						<div className="template-card-body">
							<div className="template-card-title">Clone from Community</div>
							<div className="template-card-desc">
								Copy the layout and branding from an existing community in this hub.
							</div>
						</div>
						<div className="template-card-radio">
							<div className={`radio-dot${isCloneSelected ? ' checked' : ''}`} />
						</div>
					</button>
				)}
			</div>
			{isCloneSelected && (
				<div className="clone-community-select">
					<div className="clone-select-label">Clone layout from</div>
					<CommunitySelect
						items={hubCommunities}
						itemPredicate={(query, item) =>
							item.title.toLowerCase().includes(query.toLowerCase()) ||
							item.subdomain.toLowerCase().includes(query.toLowerCase())
						}
						itemRenderer={(item, { handleClick, modifiers }) => (
							<MenuItem
								key={item.id}
								className={`clone-community-item${
									item.id === cloneCommunityId ? ' selected' : ''
								}`}
								active={modifiers.active}
								onClick={handleClick}
								text={
									<div className="clone-item-row">
										<div className="clone-item-icon">
											{item.avatar ? (
												<img src={item.avatar} alt="" />
											) : (
												<Icon icon="globe" iconSize={20} />
											)}
										</div>
										<div className="clone-item-text">
											<div className="clone-item-title">{item.title}</div>
											<div className="clone-item-slug">
												{item.subdomain}.pubpub.org
											</div>
										</div>
									</div>
								}
							/>
						)}
						onItemSelect={(item) => onCloneCommunitySelect(item.id)}
						popoverProps={{
							minimal: true,
							popoverClassName: 'clone-community-popover',
						}}
						filterable={hubCommunities.length > 8}
						noResults={<MenuItem disabled text="No communities found" />}
					>
						<Button
							rightIcon="caret-down"
							fill
							alignText="left"
							className="clone-trigger-button"
						>
							{selectedCommunity ? (
								<span className="clone-trigger-content">
									<span className="clone-trigger-icon">
										{selectedCommunity.avatar ? (
											<img src={selectedCommunity.avatar} alt="" />
										) : (
											<Icon icon="globe" iconSize={18} />
										)}
									</span>
									<span className="clone-trigger-text">
										<span className="clone-trigger-title">
											{selectedCommunity.title}
										</span>
										<span className="clone-trigger-slug">
											{selectedCommunity.subdomain}.pubpub.org
										</span>
									</span>
								</span>
							) : (
								'Select a community...'
							)}
						</Button>
					</CommunitySelect>
				</div>
			)}
			{hasMore && !showAll && (
				<Button
					minimal
					small
					icon="more"
					text={`Show ${options.length - INITIAL_VISIBLE} more templates`}
					onClick={() => setShowAll(true)}
					style={{ marginTop: 8 }}
				/>
			)}
		</div>
	);
};

export default TemplatePicker;
