import { mathBackspaceCmd } from '@benrbray/prosemirror-math';
import {
	baseKeymap,
	chainCommands,
	createParagraphNear,
	deleteSelection,
	exitCode,
	joinBackward,
	joinDown,
	joinUp,
	lift,
	liftEmptyBlock,
	newlineInCode,
	selectNodeBackward,
	selectParentNode,
	setBlockType,
	toggleMark,
	wrapIn,
} from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import { undoInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { liftListItem, sinkListItem, splitListItem, wrapInList } from 'prosemirror-schema-list';
import { type EditorState, TextSelection } from 'prosemirror-state';

import { type Dispatch, splitBlockPreservingAttrs } from '../commands';
import { codeBlockArrowHandlers } from './code';
import { EMAIL_OR_URI_REGEX, linkRuleHandler } from './inputRules';

const mac = typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false;

// :: (Schema, ?Object) → Object
// Inspect the given schema looking for marks and nodes from the
// basic schema, and if found, add key bindings related to them.
// This will add:
//
// * **Mod-b** for toggling [strong](#schema-basic.StrongMark)
// * **Mod-i** for toggling [emphasis](#schema-basic.EmMark)
// * **Mod-`** for toggling [code font](#schema-basic.CodeMark)
// * **Ctrl-Shift-0** for making the current textblock a paragraph
// * **Ctrl-Shift-1** to **Ctrl-Shift-Digit6** for making the current
//   textblock a heading of the corresponding level
// * **Ctrl-Shift-Backslash** to make the current textblock a code block
// * **Ctrl-Shift-8** to wrap the selection in an ordered list
// * **Ctrl-Shift-9** to wrap the selection in a bullet list
// * **Ctrl->** to wrap the selection in a block quote
// * **Enter** to split a non-empty textblock in a list item while at
//   the same time splitting the list item
// * **Mod-Enter** to insert a hard break
// * **Mod-_** to insert a horizontal rule
// * **Backspace** to undo an input rule
// * **Alt-ArrowUp** to `joinUp`
// * **Alt-ArrowDown** to `joinDown`
// * **Mod-BracketLeft** to `lift`
// * **Escape** to `selectParentNode`

export default (schema) => {
	const keys = {};
	const bind = (key, cmd) => {
		keys[key] = cmd;
	};

	bind('Mod-z', undo);
	bind('Shift-Mod-z', redo);
	bind('Backspace', undoInputRule);
	if (!mac) bind('Mod-y', redo);

	bind('Alt-ArrowUp', joinUp);
	bind('Alt-ArrowDown', joinDown);
	bind('Mod-BracketLeft', lift);
	bind('Escape', selectParentNode);

	if (schema.marks.strong) {
		bind('Mod-b', toggleMark(schema.marks.strong));
	}
	if (schema.marks.em) {
		bind('Mod-i', toggleMark(schema.marks.em));
	}
	if (schema.marks.sup) {
		bind('Mod-.', toggleMark(schema.marks.sup));
	}
	if (schema.marks.sub) {
		bind('Mod-,', toggleMark(schema.marks.sub));
	}
	if (schema.marks.strike) {
		bind('Mod-Shift-x', toggleMark(schema.marks.strike));
	}
	if (schema.marks.code) {
		bind('Mod-<', toggleMark(schema.marks.code));
	}
	if (schema.marks.link) {
		bind('Mod-k', toggleMark(schema.marks.link));
	}

	if (schema.nodes.bullet_list) {
		bind('Shift-Ctrl-8', wrapInList(schema.nodes.bullet_list));
	}
	if (schema.nodes.ordered_list) {
		bind('Shift-Ctrl-9', wrapInList(schema.nodes.ordered_list));
	}
	if (schema.nodes.blockquote) {
		bind('Ctrl->', wrapIn(schema.nodes.blockquote));
	}
	if (schema.nodes.hard_break) {
		const cmd = chainCommands(exitCode, (state, dispatch) => {
			dispatch!(
				state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView(),
			);
			return true;
		});
		bind('Mod-Enter', cmd);
		bind('Shift-Enter', cmd);
		if (mac) bind('Ctrl-Enter', cmd);
	}
	if (schema.nodes.list_item) {
		bind('Enter', splitListItem(schema.nodes.list_item));
		bind('Mod-[', liftListItem(schema.nodes.list_item));
		bind('Mod-]', sinkListItem(schema.nodes.list_item));
		bind('Tab', sinkListItem(schema.nodes.list_item));
		bind('Shift-Tab', liftListItem(schema.nodes.list_item));
	}
	if (schema.nodes.paragraph) {
		bind('Shift-Ctrl-0', setBlockType(schema.nodes.paragraph));
	}
	if (schema.nodes.code_block) {
		bind('Shift-Ctrl-\\', setBlockType(schema.nodes.code_block));
	}
	if (schema.nodes.heading) {
		for (let index = 1; index <= 6; index += 1) {
			bind(`Shift-Ctrl-${index}`, setBlockType(schema.nodes.heading, { level: index }));
			bind(`Alt-Ctrl-${index}`, setBlockType(schema.nodes.heading, { level: index }));
		}
	}
	if (schema.nodes.code_block) {
		Object.entries(codeBlockArrowHandlers).forEach(([key, cmd]) => bind(key, cmd));
	}
	if (schema.nodes.horizontal_rule) {
		bind('Mod-_', (state, dispatch) => {
			dispatch(
				state.tr
					.replaceSelectionWith(schema.nodes.horizontal_rule.create())
					.scrollIntoView(),
			);
			return true;
		});
	}
	if (schema.nodes.math_inline) {
		// modify the default keymap chain for backspace
		bind(
			'Backspace',
			chainCommands(deleteSelection, mathBackspaceCmd, joinBackward, selectNodeBackward),
		);
	}

	const customBlockSplitter = splitBlockPreservingAttrs(['textAlign', 'rtl']);

	// This command runs the link input rule (converting emails and urls into links) whenever the
	// user presses enter. Adding this to our enter handler is a hack to make sure the input rule
	// behavior still works even though input rules don't work across nodes (see
	// https://discuss.prosemirror.net/t/trigger-inputrule-on-enter/1118/4 and
	// https://github.com/ProseMirror/prosemirror-inputrules/pull/6#issuecomment-894107661 for
	// context)
	const addLinkCommand = (state: EditorState, dispatch?: Dispatch) => {
		if (!(state.selection instanceof TextSelection)) {
			return false;
		}
		const $cursor = state.selection.$cursor;
		if (!$cursor) {
			return false;
		}
		const { nodeBefore } = state.selection.$from;
		if (!nodeBefore || !nodeBefore.isText) {
			return false;
		}

		const match = nodeBefore.text!.match(EMAIL_OR_URI_REGEX);
		if (!match) {
			return false;
		}

		if (dispatch) {
			// Call our custom split block command, then add the link marks as part of the same
			// transaction. This should be safe to do without mapping the start and end positions
			// because the changes caused by splitBlock will all be after the cursor
			customBlockSplitter(state, (tr) => {
				const addLinkMark = linkRuleHandler(schema.marks.link, false, tr);
				const start = $cursor.pos - match[0].length;
				const end = $cursor.pos;
				dispatch(addLinkMark(state, match, start, end));
			});
		}
		return true;
	};

	// All but the custom block splitting command and the add link command in this chain are taken
	// from the default chain in baseKeymap. We provide our own block splitter that preserves text
	// align attributes between paragraphs.
	const customEnterCommand = chainCommands(
		addLinkCommand,
		newlineInCode,
		createParagraphNear,
		liftEmptyBlock,
		customBlockSplitter,
	);

	return [keymap(keys), keymap({ ...baseKeymap, Enter: customEnterCommand })];
};
