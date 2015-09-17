# React Djatoka client module


```javascript
import React from "react";
import {DjatokaClient, Minimap, Zoom, FillButton} from "hire-djatoka-client";

// from XHR
let config = {
	"identifier": "http://localhost:8080/jp2/13434696301791.jp2",
	"imagefile": "/var/cache/tomcat6/temp/cache15069217286472590195734192754.jp2",
	"width": "4355",
	"height": "3300",
	"dwtLevels": "6",
	"levels": "6",
	"compositingLayerCount": "1"
};

React.render((
	<div>
		<div style={{height: "120px", width: "80px", display: "inline-block", verticalAlign: "top"}}>
			<Minimap config={config} service="https://tomcat.tiler01.huygens.knaw.nl/adore-djatoka/resolver" />
		</div>
		<div style={{width: "400px", height: "400px", border: "1px solid", display: "inline-block"}}>
			<DjatokaClient scaleMode="widthFill" config={config} service="https://tomcat.tiler01.huygens.knaw.nl/adore-djatoka/resolver" />
		</div>
		<div style={{display: "inline-block", verticalAlign: "top", width: "450px"}}>
			<Zoom />
			<FillButton scaleMode="widthFill" />
			<FillButton scaleMode="heightFill" />
			<FillButton scaleMode="fullZoom" />
			<FillButton scaleMode="autoFill" />
		</div>
	</div>
), document.body);
```