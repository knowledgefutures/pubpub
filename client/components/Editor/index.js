export default from './Editor';
export * from './utils';

/*
Menus for this editor are to be built by whatever external tool is wrapping the <Editor /> component. Menu buttons should use the following to prevent focus loss:
```javascript
onMouseDown={(evt)=> {
    evt.preventDefault();
}}
```
*/
