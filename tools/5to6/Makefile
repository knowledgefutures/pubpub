.phony:
	transform transform-all upload-all clean 

transform:
	echo $(pub) | node -r esm --max-old-space-size=12000 v5 --bust-cache
	
upload:
	echo $(pub) | node -r esm --max-old-space-size=12000 v6

transform-all:
	node status.js --print-status=unstarted | node -r esm --max-old-space-size=12000 v5

upload-all:
	node status.js --print-status=transformed | node -r esm --max-old-space-size=12000 v6

clean:
	node status.js --print-status=all | node clean.js

mend:
	node v5/mend.js $(pub)
