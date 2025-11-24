import audio from './audio';
import { baseMarks, baseNodes } from './base';
import citation from './citation';
import code from './code';
import deprecated from './deprecated';
import equation from './equation';
import file from './file';
import footnote from './footnote';
import iframe from './iframe';
import image from './image';
import math from './math';
import reference from './reference';
import table from './table';
import video from './video';

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
