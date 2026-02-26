# fix-dois

Scripts for finding and fixing DOIs that are in our database but never actually made it to CrossRef.

## discover broken DOIs

Scan a specific community (or everything) for DOIs we think we deposited but CrossRef doesn't have:

```sh
npm run tools discoverBrokenDois -- --subdomain rapidreviewscovid19
npm run tools discoverBrokenDois -- --community 2e3983f5-xxxx-xxxx-xxxx-xxxxxxxxxxxx
npm run tools discoverBrokenDois  # all communities, takes a while. Probably don't do this
```

You can limit the range of pubs to check with `--range start-end`:

```sh
npm run tools discoverBrokenDois -- --subdomain rapidreviewscovid19 --range 0-50
```

Outputs a `discovered-*.json` file that can be fed directly into the other two scripts.

## fix broken DOIs

Takes a JSON file of broken DOIs and re-deposits them, handling the supplement disconnect/reconnect dance:

```sh
npm run tools fixDois -- --input tools/fix-dois/discovered-community-2e3983f5-1772120953981.json
npm run tools fixDois -- --dry-run  # uses real-failurs.json, doesn't actually deposit anything
npm run tools fixDois -- --range 0-5  # just the first 5 entries
```

## verify deposits

Check whether DOIs from any of the above output files actually exist in CrossRef:

```sh
npm run tools verifyDois -- --input tools/fix-dois/results-1772120953981.json
npm run tools verifyDois -- --input tools/fix-dois/real-failurs.json --range 0-20
```

Exits with code 1 if any DOIs are missing, 0 if all good.
