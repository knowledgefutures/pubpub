sync-postgres:
	heroku pg:copy pubpub-v6-prod::DATABASE_URL DATABASE_URL --app pubpub-v6-dev
	
sync-firebase:
	node -r esm --max-old-space-size=12000 syncFirebase.js
	
sync-all:
	make sync-postgres
	wait
	make sync-firebase
