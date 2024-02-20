#!/bin/bash

export GIT_REPOSITORY_URL="$GIT_REPOSITORY_URL"

echo "Cloning repository from $GIT_REPOSITORY_URL"
git clone $GIT_REPOSITORY_URL /home/app/output

echo "Building project"

exec node script.js