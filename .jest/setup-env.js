/**
 * This file helps us prepare an environment for Jest tests to run. Because
 * these run in Node rather than the browser, there are some things we do to
 * make these environments match. A lot of this is handled by JSDom, but there
 * are some edge cases.
 */

// ProseMirror uses document.getSelection, which is not polyfilled by JSDOM.
document.getSelection = document.getSelection || function() {
    return {
        focusNode: null,
        anchorNode: null,
        rangeCount: 0,
    };
}

// ProseMirror uses document.createRange, which is not polyfilled by JSDOM.
document.createRange = document.createRange || function() {
    return {
        setStart: () => {},
        setEnd: () => {},
        getClientRects: () => [],
        getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        }),
    };
}

// ProseMirror wants to use execCommand (probably for copy/paste)
document.execCommand = () => true;
