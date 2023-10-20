#!/bin/sh
mkdir -p build
VERSION=$(cat package.json | grep '"version"' | awk '{ print $2 }' | sed 's/[",]//g')
zip -r -q "build/${VERSION}.zip" dist
