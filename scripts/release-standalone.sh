#!/bin/bash

git add build/hire-djatoka-client-$npm_package_version.js
git add build/hire-djatoka-client-$npm_package_version-standalone.js
git commit -a -m "new standalone release $npm_package_version"
git push origin master