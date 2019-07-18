.phony:
	transform transform-all upload-all clean 

# 1
parse-original-firebase:
	node -r esm --max-old-space-size=12000 readFirebase.js

# 2
transform-all:
	node allPubIds.js | node -r esm --max-old-space-size=12000 v5

# 3
migrate-v5-postgres:
	node -r esm base/index.js

# 4
upload-all:
	node allPubIds.js | node -r esm --max-old-space-size=12000 v6

# 4.5
map-discussions:
	node -r esm allDiscussionBranchIds.js | node -r esm --max-old-space-size=12000 discussions/setup.js

# 5
sync-search:
	node ../../searchSync/init.js

# 6 
## Manual file uploads for file-too-big errors

# 7 
## Manual discussion migration

#8
handbook:
	node -r esm handbookBranch

wiki:
	node -r esm --max-old-space-size=12000 wikiDiscussions/setup.js

transform:
	echo $(pub) | node -r esm --max-old-space-size=12000 v5
	
upload:
	echo $(pub) | node -r esm --max-old-space-size=12000 v6

clean:
	node status.js --print-status=all | node clean.js

mend:
	node v5/mend.js $(pub)


# parse-original-firebase: 8-9 minutes
# transform-all: 47 min serial, ~same with concurrency
# migrate-v5-postgres: 5 min
# upload-all: ~75 minutes


# node status.js --print-status=error --print-problems
# node status.js --print-status=warning --print-problems
