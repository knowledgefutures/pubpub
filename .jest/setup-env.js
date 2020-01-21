/**
 * This file helps us prepare an environment for Jest tests to run. Because
 * these run in Node rather than the browser, there are some things we do to
 * make these environments match. A lot of this is handled by JSDom, but there
 * are some edge cases.
 */

process.env.AWS_ACCESS_KEY_ID = '';
process.env.AWS_SECRET_ACCESS_KEY = '';
process.env.DOI_SUBMISSION_URL = '';
process.env.DOI_LOGIN_ID = '';
process.env.DOI_LOGIN_PASSWORD = '';
process.env.MATOMO_TOKEN_AUTH = '';
process.env.MAILGUN_API_KEY = 'some-nonsense';
process.env.MAILCHIMP_API_KEY = '';
process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = '';
process.env.CLOUDAMQP_APIKEY = '';
process.env.CLOUDAMQP_URL = '';
process.env.ALGOLIA_ID = 'ooo';
process.env.ALGOLIA_KEY = 'ooo';
process.env.ALGOLIA_SEARCH_KEY = 'ooo';

if (typeof document !== 'undefined') {
    require("mutationobserver-shim");

    // ProseMirror uses document.getSelection, which is not polyfilled by JSDOM.
    document.getSelection = document.getSelection || function() {
        return {
            focusNode: null,
            anchorNode: null,
            rangeCount: 0,
            addRange: () => {},
            removeAllRanges: () => {},
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
}

if (typeof window !== 'undefined') {
    window.requestIdleCallback = () => {};
}

global.fetch = () => Promise.resolve();