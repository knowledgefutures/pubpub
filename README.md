# PubPub

Collaborative Community Publishing

## To Install

```
npm install

```

To run locally on a Mac, use [Homebrew](https://brew.sh/) to install a handful of dependencies:

```
brew install pandoc poppler
```

(See `Aptfile` for a list of equivalent Debian packages to install)

## To Run Dev Mode

```
npm start
```

Navigate to `localhost:9876`

## Storybook

To build and test components, we use Storybook. To run:

```
npm run storybook
```

Navigate to `localhost:9001`

## To Build and Run Production Version

```
npm run prod
```

Navigate to `localhost:9876`

# Pandoc

## Latex

The [Latex Buildpack we are using](https://github.com/Thermondo/heroku-buildpack-tex) allows a
`texlive.packages` file in the root directory to specify additional packages to be installed.
[List of available packages](http://fedoraproject.org/wiki/Features/TeXLive) (I think...
documentation on packages is a bit tough to find).
[Can be useful](https://rpmfind.net/linux/rpm2html/search.php?query=texlive-collection-fontsextra)
for understanding what's in collections. Not sure why it's so hard to find official documentation on
texlive packages available.

# Code Practices

## Containers vs Components

The client side code of PubPub does follow a
[Container/Component](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) split
as is common in React-based sites. The structure and difference between the two in this repo is not
exactly as described in the preceeding article. For this repo, the following describes how
containers and components are differentiated:

### Containers

-   Associated with a specific URL route
-   One a single container is used on a given URL route
-   Calls hydrateWrapper() to initialize React bindings after using server-side renered HTML for
    immediate display.
-   Holds the ground truth data for a given view. Often the ground truth data is passed into
    containers as props through hydrateWrapper(), but in cases where the ground truth data is being
    changed, the container will hold ground truth data in it's state.

### Components

-   All other non-container components :)
-   Many components are used within a given URL route
-   Can store it's own state if needed for UX functionality - but should always update the ground
    truth data held in its parent container.
-   Can make it's own API requests when the functionality and layout of the pertaining request is
    contained within the single component. Though if this request influences the ground truth data,
    the component should be passed an updating function that allows it to update the ground truth
    data held in the container.

## Commits

Preferred practice is to prefix commits with one of the following categories:

-   `fix`: for commits focused on specific bug fixes
-   `feature`: for commits that introduce a new feature
-   `update`: for commits that improve an existing feature
-   `dev`: for commits that focus solely on documentation, refactoring code, or developer experience
    updates
    
## Supporting Services
Thank you to these groups for providing their tools for free to PubPub's open source mission.

[![Browserstack-logo@2x](https://user-images.githubusercontent.com/1000455/64237395-318a4c80-cef4-11e9-8b78-98ed3ec58ce3.png)](https://www.browserstack.com/)

## Code of Conduct
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg)](https://github.com/knowledgefutures/general/blob/master/CODE_OF_CONDUCT.md)
