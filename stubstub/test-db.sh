#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

cd "$parent_path"

username="testuser"
password="testpwd"
test_db_name="pubpub-testdb"
db_url="postgres://$username:$password@localhost:5432/$test_db_name"


if [ "$1" == "--create" ]; then
  req_commands=("psql" "dropuser" "createdb" "dropdb")
  for cmd in "${req_commands[@]}"
  do
    if ! [ -x "$(command -v $cmd)" ]
    then
      echo "This script relies on the Postgres '$cmd' utility to work."
      echo "If you're using a Mac you might try 'brew install postgres'."
      exit 1 
    fi
  done
  echo "Setting up the test database..."
  dropdb $test_db_name > /dev/null 2>&1
  dropuser $username > /dev/null 2>&1
  psql -c "CREATE USER $username WITH PASSWORD '$password';" > /dev/null 2>&1
  createdb pubpub-testdb --no-password --owner $username > /dev/null 2>&1
fi

echo $db_url