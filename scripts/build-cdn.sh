#!/bin/bash

# Bundle React libs

echo "Exporting standalone for version: $npm_package_version"


node_modules/.bin/browserify \
	--require react | node_modules/.bin/uglifyjs > build/react-libs.js

node_modules/.bin/browserify src/standalone.jsx \
	--extension=.jsx \
	--standalone djatokaClientApp \
	 --transform [ babelify ] \
  	-t brfs \
  	--verbose \
	--external react | node_modules/.bin/uglifyjs > build/pack.js


cat build/react-libs.js build/pack.js > build/hire-djatoka-client-$npm_package_version.js
rm build/react-libs.js
rm build/pack.js
