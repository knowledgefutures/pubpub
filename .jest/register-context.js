/**
 * This file is used to setup the require-context-hook plugin, which is used to
 * polyfill the Webpack-specific require.context() utility in non-Webpack
 * environments (e.g. Node, where Jest is running). We use require.context()
 * when compiling a list of all Storybook entries to test in Jest.
 */
import registerRequireContextHook from 'babel-plugin-require-context-hook/register';
registerRequireContextHook();
