import { CustomScript as CustomScriptModel } from 'server/models';
import { SerializedModel } from './serializedModel';

export type CustomScriptType = 'css' | 'js';
export type CustomScripts = { [type in CustomScriptType]: null | string };
export type CustomScript = SerializedModel<CustomScriptModel>;
