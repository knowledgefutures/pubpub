# The PubPub bulk importer

This document describes how to configure and use the bulk importer to import many documents into PubPub at once. This tool is a wrapper around the regular "Pub import" tool that can be used from the PubPub UI to upload files into an existing Pub, which in turn is a wrapper around Pandoc.

# Basic usage

The bulk importer acts on directories with potentially hundreds of files of subdirectories. To determine how to turn these into Pubs, it looks for YAML config files inside the directory with the suffix `.pubpub.yaml`. These files represent _directives_ that tell the importer what to do with the directory. Consider the following directory structure:

```
my-blog/
  first-post.md
  second-post.md
  third-post.md
  ...
  config.pubpub.yaml
```

Here is a minimal configuration file that will create a new Community and import every Markdown file as a new Pub:

```yaml
# (config.pubpub.yaml)

type: community
create: true
title: My Blog

children:
    "*.md":
        type: pub
```

This file specifies a directive that, by virtue of its location in the filesystem, matches the `my-blog/` directory. The only universally required property on a directive is `type`, which must be one of `community`, `collection`, or `pub`. Directives of type `pub` always create new Pubs, but the other two types can create new objects or target existing ones.

One other commonly used property is `children`. The _keys_ of the `children` are relative paths from the root of the directory (permitting a simple wildcard syntax) and their _values_ are directives that will be applied to any matching paths. In this example, `type: pub` is a simple directive that will create one Pub for each file matching `*.md`.

Though `children` makes it easy to keep mostly everything in one file, a complicated import might contain several different directive files, possibly at different subdirectory levels. The directory structure is taken to mirror Community structure, so Collections and Pubs matched by a `community` directive in a containing folder will be created within that Community.

It's okay to gloss over this. A full list of possible values to provide here is given in the [Directives](#directives) section, and some useful examples are given in the [Recipes](#recipes) section.

# Invocation

Bulk import of Pubs is accomplished using a command-line tool whose contents live in this directory. It is invoked as a two-step process. The first step is as follows:

```
npm run tools bulkimport -- --directory /path/to/target --actor=pubpub-user-slug --receipt /path/to/receipt
```

where:

- `--directory` is a folder full of documents that can be turned into Pubs.
- `--actor` is a slug of a PubPub user taking these actions.
- `--receipt` is a path to write a record of what was imported.

these arguments are optional:

- `--community` is the subdomain of a community to target (used in lieu of a directive).
- `--dry-run` to print a description of what will be imported, without doing it.
- `--yes` to skip all confirmation prompts.

Any Communities, Collections, and Pubs created will be immediately visible online, though Collections will be private and Pubs will remain unreleased. A record of what was created will be stored in the `receipt` file, which will be referenced later when publishing or discarding changes. If you're happy with the way things look on PubPub, you can take the second step of publishing these changes — creating a Release for newly created Pubs, and making Collections public — as follows:

```
npm run tools bulkimport -- --actor=pubpub-user-slug --receipt /path/to/receipt --publish
```

You can choose whether to create Pub exports (which you may not want during testing) using the `--create-exports` flag, which defaults to `true`.

If you want to discard all _created_ objects (preserving those that were targeted by directives but not created by them), then run:

```
npm run tools bulkimport -- --actor=pubpub-user-slug --receipt /path/to/receipt --discard
```

By default, all of these commands will interface with the development (`duqduq`) instance. When you're ready to write things to prod, prepend all of these commands with `PUBPUB_PRODUCTION=true`.

# Writing directives

There is a [kitchen sink](#directive-options) of directive options available, but a conceptual overview of important ones might be useful before we list them all.

## Understanding how directives are resolved

The maxim for really understanding bulk import is as follows:

> For every file or folder in the import path, for every _type_ of directive that matches that file or folder, one PubPub object of _type_ will be created.

Let's unpack that a little. First, note the verb — directives _match_ files — as we've seen, directives at the root of `.pubpub.yaml` files implicitly match their containing directory, and `children` inside those files match paths given relative to that directory. Let's make that explicit with an example:

```
my-import/
  config.pubpub.yaml
  posts/
    ...
    2018/
    2019/
    2020/
      jan/
      feb/
      march/
        guest-post.md
      ...
```

```yaml
# (config.pubpub.yaml)

type: community
subdomain: kfg-notes

children:
    posts/*/*/*.md:
        type: pub
        attribution:
            - Catherine Ahearn
            - Travis Rich
            - Gabe Stein
    posts/2020/march/guest-post.md:
        type: pub
        attributions:
            - {name: "Joel Gustafson", roles: ["Guest Poster"]}
```

There are three directives in this file. The outermost one has `type: community` and _matches_ the outermost directory. The two other directives are inside of `children`, and you'll notice that they both have `type: pub`, and both of them _match_ the file `posts/2020/march/guest-post.md`! When this happens, the directives will be merged, and only one Pub will be created for that Markdown file.

### The `partial` option

When working with structures like this, the `partial: true` option is very helpful. If _all_ of the directives of a given type matching a file are _partial_, they will be discarded and no object will be created. This lets you use a wildcard to specify shared properties across many matched files, without importing all files that could possibly be matched. In the above example, if we were to write:

```yaml
posts/*/*/*.md:
    type: pub
    partial: true
    ...
```
Only one Pub would be created from the entire import, from `guest-post.md`.

## Creating vs. targeting objects

Depending on whether the Community or Collection you wish to import Pubs to already exists or not, you will want to either pass `create: true`, or specify an existing Community or Collection by `subdomain` and `slug`, respectively:

```yaml
# creating a new Collection
type: collection
create: true
title: My New Collection
slug: my-new-collection # optional
```

```yaml
# targeting an existing Collection
type: collection
slug: this-one-already-exists
```

(Recall that the above directive must be nested inside one targeting a Community, or must be invoked with the `--community` flag, for this to work.)

```yaml
# creating a new Community
type: community
create: true
title: My New Community
description: "Pretty cool, no?" # optional
subdomain: my-new-community # optional
```

```yaml
# targeting an existing Community
type: community
subdomain: an-existing-community
```

The importer never targets an existing Pub, so `type: pub` implies `create: true`.

## Specifying children

The `children` field of a directive can be thought of as a shortcut to creating many `.pubpub.yaml` files scattered across the import directory. For instance, you might have the following structure:

```
a-bunch-of-articles/
  article-one/
    doc.tex
    sources.bib
    dog.png
  article-two/
    ...
  article-three/
   ...
```

Rather than placing a `.pubpub.yaml` with a `type: pub` directive inside of each `article-` directory, you can use `children` to accomplish the same thing:

```yaml
children:
    "*":
        type: pub
```

The keys of `children` can be paths to files or folders, including a simple wildcard syntax in which:

-  `*.ext` will match any `.ext` file
- `foo.*` will match any file named `foo` (minus the extension)
-  `*` will match any directory
-  `*.*` will match any file (you usually don't want this one)

It is of course possible to nest several layers of directives within a single file by nesting `children`. The importer doesn't support nested collection directives, though — every Pub is expected to be the child of at most one.

## Turning files into Pubs

It is important to understand that directives can target either entire directories or individual files to create Pubs. The former case is more typical, but the latter might be encountered if e.g. you're splitting a TeX bundle for a whole book into many Pubs by targeting each chapter's `.tex` file as a Pub. When an entire directory is specified, all of its contents will be passed as source files to the Pub importer, which is fairly good about inferring what to do with them.

## The `labels` option

When you need fine-grained control over the roles that individual files play in a Pub import, use the `labels` directive option, e.g.:

```yaml
labels:
    document: my-tex-file.tex
    bibliography: sources.bib
    preambles:
        - setup.tex
    supplements:
        - postscript.tex
```
These labels are consumed by the per-Pub importer as follows: the `preambles`, the `document`, and the `supplements` are passed into Pandoc in that order, e.g.:

```
pandoc [p1 p2 p3...] doc [s1 s2 s3...]
```

The `biblography` is not passed directly into Pandoc and is used to extract a bibliography with `pandoc-citeproc` and CitationJS instead. Note that — as with the single-Pub importer — there can only be one `document` and one `bibliography`.

## The `resolve` option

When you need to bring extra files into the Pub import that are not inside of its directory, use the `resolve` directive option, e.g.;

```yaml
resolve:
    - ../path/to/images:
        into: images/
    - ../../path/to/specific/file.tex:
        as: other-file.tex
        label: preamble # (or any other label, optional)
```

The `into` option rewrites file paths for use in the import. For instance, a document expecting to see `images/dog.png` will be redirected to find it in `../path/to/images/dog.png` instead. Likewise, `as` resolves individual files outside of the target directory by a specific name.

This can be very helpful if you're dealing with TeX bundles which give references to resources such as images as paths relative from the root of the bundle rather than the containing file. The `into` and `as` values do not even need to be file paths — if your source material references URLs that are mirrored in a local directory structure, you can do something like:

```yaml
resolve:
    - ../../wp-content:
      into: http://my-site.com/wp-content/
```

**Important:** paths given to `resolve` are relative to the file or directory matched by the directive, not to the file in which the directive is written. For instance, given the following structure:

```
my-import/
  posts/
    my-first-post.md # Expects "images/dog.png"
  images/
    dog.png
  config.pubpub.yaml
```

We would turn `my-first-post.md` into a Pub as follows:

```yaml
# config.pubpub.yaml

children:
    posts/my-first-post.md:
        resolve:
            - ../images:
                into: images/
```

The thing to note here is `../images` is the relative path from `my-first-post.md`, rather than from `config.pubpub.yaml`.

If a path under `resolve` does not lead to a file or directory, it will throw an error. You can silence the error and press onward with the import by specifying the `ignoreIfMissing: true` option under the path.

## Attributes

Pub directives can contain basic metadata information like:

```yaml
title: Some New Pub
description: It's a description
slug: a-pub-we-made
```

But all of these are optional. Where they are omitted, they may be derived from metadata that Pandoc extracts during import, though this may be configured using the `attributeStrategy` option.

Pub or Collection directives can specify attribution information that will be turned into `PubAttribution` or `CollectionAttribution` objects, e.g.:

```yaml
type: pub
attributions:
    - Author One
    - {
        name: "Author Two",
        affiliation: "Some University of Something"
    }
    - slug: author-three
```

As shown here, a string is sufficient, but an object with `PubAttribution`/`CollectionAttribution` properties is also accepted. Where a `slug` is provided, it is resolved to a PubPub user.

Attribution information will likewise be inferred from the Pandoc import unless `attributeStrategy` is configured to ignore it.

## Macros

As something of a last resort, the importer can run automated find-and-replace operations ('macros') on the text that will be passed into Pandoc. A simple macro looks like this:

```yaml
macros:
    "find me": "replace me with this"
```
But of course, the keys here are compiled to regular expressions, and the values take regex-interpolated style positional arguments, e.g.

```yaml
macros:
    "do (.*) before (.*)": "do $2 after $1"
```

The real power of macros is the `define` feature. Intead of inserting a new string, specifying an object with `define` will replace the matched text with an empty string, and record a value for later retrieval instead.

```yaml
macros:
    "\\sepfootnotecontent{(.*)}{(.*)}:
        define: ["footnote-$1", "$2"]
    "\\sepfootnote{(.*)}": "${footnote-$1}"
```

This can be helpful for mocking out some complicated TeX commands that Pandoc doesn't support, as described in [Mocking Latex Commands](#mocking-latex-commands).

## The special `$metadata` and `$sourceFile` values

Not all potentially useful directive options have statically-known values. You might, for instance, want to extract the description for a Pub from its embedded metadata header. Typically, this is only possible if the embedded description has the key `subtitle` — more commonly used in Pandoc-flavored markdown — but the `$metadata` option gives us more flexibility. In place of a string, you may pass an object like `{ $metadata: 'key' }` as a directive value, and its value will be taken from the metadata extracted from the imported document. In the example files below, the document itself has metadata we wish to use as the Pub's description:

```
---
title: Please import me
summary: Blah blah BLAH blah blah...
---
<h1>Lorem Ipsum Dolor Sid Amet...</h1>
```

The following Pub directive will extract the `summary` value (`"Blah blah BLAH..."`) as the Pub's `description`:

```yaml
# config.pubpub.yaml
type: pub
description:
  $metadata: summary
```

The other special value of this kind of `$sourceFile`. It means "give me the URL of the uploaded source file corresponding to this path". In this example, every document to be imported is paired with an `thumb.png`:

```
import-root/
  document-one/
    doc.html
    thumb.png
  document-two/
    doc.html
    thumb.png
```

The following Pub directive will cause the corresponding `thumb.png` files to be used as the Pub's `avatar`:

```yaml
# config.pubpubb.yaml
children:
  "*/doc.html":
    type: pub
    avatar:
      $sourceFile: thumb.png
```

Note that these special values can be composed, to useful effect. We might find a file specified in the document metadata:

```
---
thumbnail: cover-image-for-this-post.jpg
---
```

We can extract the relative file path with `$metadata` and tell the importer to upload the resolved file as the Pub's `avatar` as follows: 

```yaml
# config.pubpub.yaml
type: pub
avatar:
  $sourceFile:
    $metadata: thumbnail
```

# Directive options

**`type: string`**: universally required. One of `pub`, `collection`, `community`.

**`create: boolean`**: required to create a new Community or Collection. Implied `true` when `type: pub`.

**`partial: boolean`**: [see more](#the-partial-option)

**`subdomain: string`**: required to target an existing Community.

**`slug: string`**: required to target an existing Collection. Optional when creating new Pubs or Collections.

**`title: string`**

## For Pubs and Collections

**`attributions: (string | {slug?:string, name?:string, ...attributionProperties?})[]`**: will be added as `PubAttribution` or `CollectionAttribution` objects. If `slug` is specified, it must match a PubPub user.

**`doi: string`**

## For Collections

**`kind: string`**: defaults to `tag`.

## For Pubs

**`attributeStrategy: 'merge' | 'import' | 'directive'`**: dictates whether Pub attributes should be derived from the Pandoc import result (`'import'`), the directive (`'directive'`), or whether the two sources be merged together with the directive having priority (`'merge'`, default).

**`matchSlugsToAttributions: string[]`**: a list of PubPub slugs that will be cross-refrenced to possibly create user-linked `PubAttribution` objects from names found in imported attribution metadata. Potentially useful when importing a large Community with a few recurring names.

**`resolve: {
    [relativePath: string]: ({as: string} | {into: string}) & {label?: string, ignoreIfMissing?: boolean}
}[]`**: [see more](#the-resolve-option)

**`labels: {
    document?: string,
    bibliography?: string,
    preambles?: string[],
    supplements?: string[]
}`**: [see more](#the-labels-option)

**`preamble: string`**: a text block that will be inserted into the import as if it were in a file with `label: preamble`. This is a useful place to define TeX commands.

**`pandocMetadata: object`**: an arbitrary object that will be written as YAML to a separate file and given to the Pandoc import process as a metadata block.

**`extractMetadataFromDocument: boolean`**: extract metadata from delimited YAML metadata block in _any_ document, even if it isn't a Markdown file.

**`importerFlags: string[]`**: flags passed to the importer (the same ones available from the `Meta+/` "nerd mode" menu in the single-Pub importer).

**`tags: string[]`**: a list of collections by title that will be applied to the Pub (creating a Tag collection if necessary)

**`macros: {
    [regex: string]: string | {define: [string, string]}
}`**: [see more](#macros)

_The remainder of the options map directly to attributes on the Pub model._

**`description: string`**

**`avatar: string`**

**`customPublishedAt: string`**: a date given in ISO 8601 format.

# Recipes

## One file per Pub

Given this directory structure:

```
root/
  config.pubpub.yaml
  one.md
  two.md
  three.md
  ...
  seven-hundred-and-twenty-eight.md
```

transform each `.md` file into a Pub using this directive:

```yaml
type: community
create: true

children:
    "*.md":
        type: pub
```

## One directory per Pub

Given this directory structure:

```
root/
  config.pubpub.yaml
  post-one/
    src.md
    image-1.png
    image-2.png
    ...
  post-two/
  post-three/
  ...
```

transform each `post-` directory into a Pub using this directive:

```yaml
type: community
create: true

children:
    *:
        type: pub
```

## One directory per Collection

Given this directory structure:

```
root/
  config.pubpub.yaml
  Issue One/
    some article/
      src.tex
      ...
    some other article/
    ...
  Issue Two/
  Issue Three/
  ...
```

tranform each immediate subdirectory into a Collection, and _its_ subdirectories into Pubs, using this directive:

```yaml
type: community
create: true

children:
    *:
        type: collection
        create: true
        kind: issue
        children:
            *:
                type: pub
```

This will infer collection titles from directory names, which you will probably want to clean up later. But you could also add more directives to provide explicit names to each collection.

## Specifying a Collection and a Community

You may want to specify a Collectin and a Community at the root of the import, which is a little difficult because each `.pubpub.yaml` file contains one directive, and the child directives must match subdirectories. Here, you can:

- Create two sibling directive files, e.g. `community.pubpub.yaml` and `collection.pubpub.yaml`, and they will be resolved in the appropriate order.

- Nest the entire import in a new dummy directory with the Community directive

- Target an existing Community with the CLI's `--community` argument instead.

## Referencing source files in a shared resource directory

Given this directory structure:

```
root/
  config.pubpub.yaml
  posts/
    post-one.html
    post-two-html
    ...
    post-10000.html
  resources/
    cat.png
    dog.png
    hyena.png
```

You might find HTML files with content like:

```html
<img src="resources/hyena.png">
```

To tell the importer where to find these images, use the `resolve` directive option:

```yaml
children:
  posts/*.html:
    type: pub
    resolve:
      - ../resources:
        into: resources
```

The result is as if the `resources/` directory were a sibling of each HTML file. You might even find something like this:

```html
<img src="https://best-exam-dumps-2020-here.info/resources/hyena.png">
```

If you have a local copy of the `resources` directory, you can resolve these URLs this way:

```yaml
children:
  posts/*.html:
    type: pub
    resolve:
      - ../resources:
        into: https://best-exam-dumps-2020-here.info/resources/
```

(Note the trailing slash here)

## Splitting a LaTeX book

Consider a TeX bundle for a book:

```
book/
  images/
  chapters/
    chapter-one.tex
    chapter-two.tex
    chapter-three.tex
    ...
    cruft.tex
    table1.tex
    table2.tex
  footnote-definitions.tex
  entrypoint.tex
```

The `entrypoint.tex` file looks like this:

```latex
% ...a million lines of layout cruft

% ...some potentially useful commands
\newcommand{\emc2}{$E = mc^2$}

% ...some helper files
\input{footnote-definitions.tex}

% ...and now the actual content
\input{chapters/chapter-one.tex}
\input{chapters/chapter-two.tex}
\input{chapters/chapter-three.tex}
```

We cannot import this from `entrypoint.tex` because Pandoc will not split the book into chapter-Pubs. Instead, we can do that with a `children` directive:

```yaml
children:
    chapters/*.tex:
        type: pub
        attributions:
            - Author One
            - Author Two
            - Author Three
```

But there is a problem — each of the chapters implicitly relies on the content from the `footnote-definitions.tex` file, and from the useful `\newcommand` definitions in the entrypoint file. We can solve the first problem using `resolve`:

```yaml
children:
    chapters/*.tex:
        type: pub
        ...
        resolve:
            - ../footnote-definitions.tex:
                as: _.tex
                label: preamble
        preamble: |
            \newcommand{\emc2}{$E = mc^2$}
```

Now `footnote-definitions.tex` is included in the import of each `*.tex`, and since it is given `label: preamble`, Pandoc will process it before the chapter text. The `preamble` option lets us specify arbitrary text that will likewise be processed by Pandoc before the chapter.

Note that we can resolve `../footnote-definitions.tex` as any name we want, because it is not actually referred  by the chapter files.

###  Importing a subset of files with `partial`

We have another problem, though: not all of the `chapters/*.tex` files should actually correspond to chapters:


```
book/
  images/
  chapters/
    ...
    cruft.tex # this is just some junk, or maybe it is included by another file.
  footnote-definitions.tex
  entrypoint.tex
```

We could simply accept the fact that `cruft.tex` will create a Pub, or we could take this opportunity to split the chapters out into individual directives:

```yaml
children:
    chapters/chapter-one.tex:
        type: pub
        title: "Chapter One: The Way Things Are"
        resolve:
            - ../footnote-definitions.tex:
                as: _.tex
                label: preamble
        preamble: |
            \newcommand{\emc2}{$E = mc^2$}
    chapters/chapter-two.tex:
        type: pub
        title: "Chapter Two: The Way Things Ought to Be"
        resolve:
            - ../footnote-definitions.tex:
                as: _.tex
                label: preamble
        preamble: |
            \newcommand{\emc2}{$E = mc^2$}
```

But look at all of this duplicated information between directives! Luckily, we can factor their common features into a wildcard-matched directive with `partial: true` as follows:

```yaml
type: collection
create: true
kind: book

children:
    chapters/*.tex:
        type: pub
        partial: true
        resolve:
            - ../footnote-definitions.tex:
                as: _.tex
                label: preamble
        preamble: |
            \newcommand{\emc2}{$E = mc^2$}
    chapters/chapter-one.tex:
        type: pub
        title: Chapter One: The Way Things Are
    chapters/chapter-two.tex:
        type: pub
        title: Chapter Two: The Way Things Ought to Be
```

Here, although `chapters/*.tex` matches `cruft.tex`, it does so only "partially", with `partial: true`; this match is discarded and no Pub is created. `chapter-one.tex` matches two directives, only one of which is partial, and so a Pub is created here.

### Mocking LaTeX commands

Our final problem with this book is that its footnotes are written using the `sepfootnotes` LaTeX package, which allows you to define footnotes in one file and then reference them by ID in another file, as shown here:

```latex
% footnote-definitions.tex

\sepfootnotecontent{F-25}{private correspondence}
```

```latex
% chapter-three.tex

...the inventor of pizza has explained that it was originally intended to be eaten with pineapple\sepfootnote{F-25}, but many people...
```

Even when we `resolve` the footnotes file into each chapter, Pandoc does not know what to do with the `\sepfootnotecontent{}{}` and `\sepfootnote{}` commands that respectively define and reference footnotes. Luckily(?) we can use the `macros` directive option to mock up this feature:

```yaml
chapters/*.tex:
    type: pub
    partial: true
    ...
    macros:
      "\\\\sepfootnotecontent{(.*?)}{(.*?)}\n": 
        define: ["$1", "$2"]
      "\\\\sepfootnote{(.*?)}": "\\footnote{${$1}}"
```
As described in [Macros](#macros), each element in the `macros` object contains a string definition of a regex (hence the obscene number of backslashes) mapped to either a replacement string (to be interpolated) or a `define` object.

The first macro will cause the importer to match `\sepfootnotecontent{F-25}{private correspondence}` and `define` that `'F-25' => 'private correspondence'` later on. 

The second macro will cause `\sepfootnote{F-25}` to be resolved in the following way:

- The string `"\\footnote{${$1}}"` is the replacement value.

- `$1` is a positional argument from the `\sepfootnote{}` match and `$1 = F-25`. Now we have `"\\footnote{${F-25}}"`.

- `${F-25}` tells the importer to look up the stored value for `F-25`, which is `'private correspondence'`.

- The string is resolved to `\footnote{private correspondence}`, which is a command that Pandoc understands.
