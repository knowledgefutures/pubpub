import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBeforeUnload, useUpdateEffect } from 'react-use';
import { Button, Spinner, Tab, Tabs, Tooltip } from '@blueprintjs/core';
import classNames from 'classnames';

import { ScopeData } from 'types';
import { DashboardFrame, Icon, IconName, MobileAware, PendingChangesProvider } from 'components';
import { MenuSelect } from 'components/Menu';
import { PubPubIconName } from 'client/utils/icons';
import { useFacetsState } from 'client/utils/useFacets';
import { usePageContext, usePendingChanges } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { useSticky } from 'client/utils/useSticky';
import { useViewport } from 'client/utils/useViewport';

import AutosaveIndicator from './AutosaveIndicator';
import IconBullet from './IconBullet';

require('./dashboardSettingsFrame.scss');

type Section = React.ReactNode | (() => React.ReactNode);

export type Subtab = {
	id: string;
	title: string;
	hideSaveButton?: boolean;
	sections: Section[];
} & ({ icon: IconName } | { pubPubIcon: PubPubIconName });

type Props = {
	id: string;
	tabs: Subtab[];
	className?: string;
	hasChanges: boolean;
	persist: () => Promise<void>;
};

// Global header + breadcrumbs - 1px top border of OverviewRowSkeleton
const breadcrumbsOffset = 56 + 85 - 1;
// Global header + top of the DashboardFrame
const mobileOffset = 40 + 15;

const getSettingsUrl = (scopeData: ScopeData, subMode: undefined | string) => {
	const { activeTargetType, activeCollection, activePub } = scopeData.elements;
	if (activeTargetType === 'community') {
		return getDashUrl({ mode: 'settings', subMode });
	}
	if (activeTargetType === 'collection') {
		return getDashUrl({ mode: 'settings', collectionSlug: activeCollection!.slug, subMode });
	}
	if (activeTargetType === 'pub') {
		return getDashUrl({ mode: 'settings', pubSlug: activePub!.slug, subMode });
	}
	return '';
};

const DashboardSettingsFrame = (props: Props) => {
	const {
		tabs,
		id,
		className,
		hasChanges: hasNonFacetsChanges,
		persist: persistNonFacets,
	} = props;
	const { isMobile, viewportWidth } = useViewport();
	const { pendingCount } = usePendingChanges();
	const { locationData, scopeData } = usePageContext();
	const { hasPersistableChanges: hasFacetsChanges, persistFacets } = useFacetsState();
	const [mounted, setMounted] = useState(false);
	const [isSavingManually, setIsSavingManually] = useState(false);
	const stickyControlsRef = useRef<null | HTMLDivElement>(null);
	const hasChanges = hasNonFacetsChanges || hasFacetsChanges;
	const isSavingAutomatically = pendingCount > 0;
	const isProblematicallySmallDesktop =
		typeof viewportWidth === 'number' && viewportWidth <= 1125;

	const [currentTabId, setCurrentTabId] = useState(() => {
		const { subMode } = locationData.params;
		if (tabs.some((tab) => tab.id === subMode)) {
			return subMode;
		}
		return tabs[0].id;
	});

	const currentTab = useMemo(() => {
		return tabs.find((tab) => tab.id === currentTabId)!;
	}, [currentTabId, tabs]);

	const tabsAsMenuItems = useMemo(() => {
		return tabs.map((tab) => {
			const { id: tabId, title, ...iconProps } = tab;
			return {
				value: tabId,
				label: title,
				icon: <IconBullet small selected={currentTabId === tab.id} {...iconProps} />,
			};
		});
	}, [tabs, currentTabId]);

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		const dashUrl = getSettingsUrl(scopeData, currentTabId);
		window.history.replaceState({}, '', dashUrl);
	}, [scopeData, currentTabId]);

	useUpdateEffect(() => {
		window.scrollTo({ top: 0 });
	}, [currentTabId]);

	useSticky({
		target: stickyControlsRef.current!,
		offset: isMobile ? mobileOffset : breadcrumbsOffset,
		isActive: mounted && !isMobile,
	});

	const persist = useCallback(async () => {
		setIsSavingManually(true);
		try {
			await Promise.all([
				hasFacetsChanges && persistFacets(),
				hasNonFacetsChanges && persistNonFacets(),
			]);
		} catch (_) {
			// do nothing
		} finally {
			setIsSavingManually(false);
		}
	}, [hasFacetsChanges, persistFacets, hasNonFacetsChanges, persistNonFacets]);

	useBeforeUnload(
		hasChanges,
		'You have unsaved changes. Are you sure you want to navigate away?',
	);

	const renderControls = () => {
		const { hideSaveButton } = currentTab;
		if (hideSaveButton) {
			return <AutosaveIndicator isSaving={isSavingAutomatically} />;
		}
		return (
			<Button
				intent="primary"
				disabled={!hasChanges}
				onClick={persist}
				loading={isSavingManually}
				icon="tick"
			>
				Save changes
			</Button>
		);
	};

	const renderTab = (tab: Subtab) => {
		const { id: tabId, title, ...iconProps } = tab;

		const iconBullet = <IconBullet selected={tabId === currentTabId} {...iconProps} />;
		const wrappedIconBullet = isProblematicallySmallDesktop ? (
			<Tooltip content={title}>{iconBullet}</Tooltip>
		) : (
			iconBullet
		);

		return (
			<Tab
				id={tabId}
				key={title}
				className="dashboard-settings-frame-tab"
				panelClassName="dashboard-settings-frame-tab-panel"
				title={
					<>
						{wrappedIconBullet}
						<div className="title">{title}</div>
					</>
				}
			/>
		);
	};

	const renderTabs = (isMobileClassName: string) => {
		return (
			<Tabs
				id={id}
				large
				selectedTabId={currentTabId}
				className={classNames('dashboard-settings-frame-tabs', isMobileClassName)}
				onChange={(tabId: string) => setCurrentTabId(tabId)}
			>
				{tabs.map((tab) => renderTab(tab))}
			</Tabs>
		);
	};

	const renderTabsMenu = (isMobileClassName: string) => {
		return (
			<MenuSelect
				placement="top-start"
				className="dashboard-settings-frame-component__tabs-menu"
				aria-label="Settings section selector"
				onSelectValue={setCurrentTabId}
				items={tabsAsMenuItems}
				value={currentTabId}
				showTickIcon={false}
				icon={<Icon iconSize={16} {...currentTab} />}
				rightIcon={isSavingAutomatically ? <Spinner size={18} /> : 'caret-up'}
				buttonProps={{
					fill: true,
					className: classNames('dashboard-settings-frame-menu', isMobileClassName),
				}}
			/>
		);
	};

	const currentSections = currentTab.sections.map((section) => {
		const element = typeof section === 'function' ? section() : section;
		return element;
	});

	return (
		<DashboardFrame
			title="Settings"
			className={classNames('dashboard-settings-frame-component', className)}
		>
			<div className="dashboard-settings-frame-sticky-controls" ref={stickyControlsRef}>
				<MobileAware
					desktop={(p) => renderTabs(p.className)}
					mobile={(p) => renderTabsMenu(p.className)}
				/>
				<div className="save-container">{renderControls()}</div>
			</div>
			<div className="dashboard-settings-frame-tab-panel">{currentSections}</div>
		</DashboardFrame>
	);
};

const WithPendingChanges = (props: Props) => {
	return (
		<PendingChangesProvider>
			<DashboardSettingsFrame {...props} />
		</PendingChangesProvider>
	);
};

export default WithPendingChanges;
