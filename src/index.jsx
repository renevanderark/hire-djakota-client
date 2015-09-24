let fs = require("fs");
import insertCss from "insert-css";
let css = fs.readFileSync(__dirname + "/index.css");
insertCss(css, {prepend: true});

import React from "react";
React.initializeTouchEvents(true);
import DjatokaClient from "./components/djatoka-client";
import Minimap from "./components/minimap";
import Zoom from "./components/zoom";
import FillButton from "./components/fill-button";
import FreeMovementButton from "./components/free-movement-button";

export {DjatokaClient as DjatokaClient, Minimap as Minimap, Zoom as Zoom, FillButton as FillButton, FreeMovementButton as FreeMovementButton};
export default DjatokaClient;