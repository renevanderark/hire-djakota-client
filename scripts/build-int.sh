#!/bin/bash

echo "Exporting standalone for integration test"

node_modules/.bin/browserify \
	--require react | node_modules/.bin/uglifyjs > test/react-libs.js

node_modules/.bin/browserify src/standalone.jsx \
	--extension=.jsx \
	--standalone djatokaClientApp \
	 --transform [ babelify ] \
  	-t brfs \
  	--verbose \
	--external react | node_modules/.bin/uglifyjs > test/pack.js


cat test/react-libs.js test/pack.js > test/hire-djatoka-client.js
rm test/react-libs.js
rm test/pack.js
