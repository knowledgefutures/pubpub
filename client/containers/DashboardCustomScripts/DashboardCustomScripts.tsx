import React, { useEffect, useState } from 'react';
import { Callout, Spinner, Tabs, Tab } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';
import { communityCanUseCustomScripts } from 'utils/customScripts';
import { DashboardFrame } from 'components';
import { CustomScripts } from 'types';

import { EditorComponentType } from './types';
import CustomScriptPanel from './CustomScriptPanel';

require('./dashboardCustomScripts.scss');

type Props = {
	customScripts: CustomScripts;
};

const DashboardCustomScripts = (props: Props) => {
	const { customScripts } = props;
	const { js, css } = customScripts;
	const {
		communityData: { id: communityId },
	} = usePageContext();
	const [Editor, setEditor] = useState<null | EditorComponentType>(null);
	useEffect(() => {
		import('@monaco-editor/react').then(({ default: EditorComponent }) =>
			setEditor(EditorComponent),
		);
	}, []);

	const renderLoading = () => {
		return (
			<div className="loading-indicator">
				<Spinner size={14} /> Loading editor
			</div>
		);
	};

	const renderTabs = () => {
		return (
			<Tabs id="custom-scripts-tabs">
				<Tab
					id="css"
					title="CSS"
					panel={
						<CustomScriptPanel
							initialContent={css}
							type="css"
							language="css"
							label="CSS"
							EditorComponent={Editor!}
						/>
					}
				/>
				{communityCanUseCustomScripts(communityId) && (
					<Tab
						id="js"
						title="JavaScript"
						panel={
							<CustomScriptPanel
								initialContent={js}
								type="js"
								language="javascript"
								label="JavaScript"
								EditorComponent={Editor!}
							/>
						}
					/>
				)}
			</Tabs>
		);
	};

	return (
		<DashboardFrame className="dashboard-custom-scripts-container" title="Custom Scripts">
			<div className="callout-text">
				<Callout className="error-callout" intent="warning" title="Warning: Experimental">
					Custom CSS lets you change the look and feel of your Community, but it also lets
					you introduce bugs that make it hard or impossible to use. The PubPub team may
					also make changes to our own source code that could break your CSS without
					warning. We don't provide support for problems caused by Custom CSS. Use caution
					(but have fun!) <br />
					Note that Custom CSS is not loaded on your Dashboard — including this page — so
					you can always return here to undo your changes if they are causing problems.
				</Callout>
			</div>

			{!Editor && renderLoading()}
			{Editor && renderTabs()}
		</DashboardFrame>
	);
};

export default DashboardCustomScripts;
