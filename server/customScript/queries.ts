import { CustomScript } from 'server/models';
import { CustomScriptType, CustomScripts } from 'types';

import { communityCanUseCustomScripts } from 'utils/customScripts';

export const setCustomScriptForCommunity = async (
	communityId: string,
	type: CustomScriptType,
	content: string,
) => {
	const existingScriptForType = await CustomScript.findOne({ where: { communityId, type } });
	if (existingScriptForType) {
		existingScriptForType.content = content;
		await existingScriptForType.save();
	} else {
		await CustomScript.create({ communityId, type, content });
	}
};

export const getCustomScriptsForCommunity = async (communityId: string): Promise<CustomScripts> => {
	const scripts = await CustomScript.findAll({ where: { communityId } });
	const css = scripts.find((s) => s.type === 'css');
	if (!communityCanUseCustomScripts(communityId)) {
		return { js: null, css: css?.content || null };
	}
	const js = scripts.find((s) => s.type === 'js');
	return {
		js: js?.content || null,
		css: css?.content || null,
	};
};
