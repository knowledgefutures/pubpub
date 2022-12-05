import { baseNodes, baseMarks } from './base';
import citation from './citation';
import equation from './equation';
import math from './math';
import code from './code';
import file from './file';
import footnote from './footnote';
import iframe from './iframe';
import image from './image';
import table from './table';
import video from './video';
import audio from './audio';
import reference from './reference';
import deprecated from './deprecated';

export const defaultNodes = {
	...baseNodes,
	...code,
	...citation,
	...equation,
	...math,
	...file,
	...footnote,
	...iframe,
	...image,
	...table,
	...video,
	...audio,
	...reference,
	...deprecated,
};

export const defaultMarks = {
	...baseMarks,
};
