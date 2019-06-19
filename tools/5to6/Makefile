.phony:
	transform transform-all upload-all clean 

transform:
	echo $(pub) | node -r esm --max-old-space-size=12000 v5 --bust-cache
	
upload:
	echo $(pub) | node -r esm --max-old-space-size=12000 v6

transform-all:
	node status.js --print-status=unstarted | node -r esm --max-old-space-size=12000 v5

upload-all:
	node status.js --print-status=transformed,warning | node -r esm --max-old-space-size=12000 v6

clean:
	node status.js --print-status=all | node clean.js

mend:
	node v5/mend.js $(pub)


# node status.js --print-status=error --print-problems



# 4 or 5 upload bugs.
	# too large, malformed JSON
# wrote a if statement that handles transform bugs
# 1 remaining transform bug
# 