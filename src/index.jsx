let fs = require("fs");
import insertCss from "insert-css";
let css = fs.readFileSync(__dirname + "/index.css");
insertCss(css, {prepend: true});

import React from "react";
React.initializeTouchEvents(true);
import DjakotaClient from "./components/djakota-client";
import Minimap from "./components/minimap";

export {DjakotaClient as DjakotaClient, Minimap as Minimap};
export default DjakotaClient;