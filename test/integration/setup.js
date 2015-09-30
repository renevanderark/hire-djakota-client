import djatokaClientApp from "../../src/standalone.jsx";
djatokaClientApp.Api.prototype.makeTileUrl = function() { return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3wkeBwUxu4ykfQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAxSURBVCjPY2AYgYARq+j///+h0oyMxJoE0QPXSb46Jvx6MHUyEbSNsKeR1ZHg6eEMAGNKHe/rFCIdAAAAAElFTkSuQmCC"; };
const config = {
	"identifier": "http://localhost:8080/jp2/13434696301791.jp2",
	"imagefile": "/var/cache/tomcat6/temp/cache15069217286472590195734192754.jp2",
	"width": "4355",
	"height": "3300",
	"dwtLevels": "6",
	"levels": "6",
	"compositingLayerCount": "1"
};
const service = "https://tomcat.tiler01.huygens.knaw.nl/adore-djatoka/resolver";
const store = djatokaClientApp.store;

const zoomContainer = document.createElement("div");
document.body.appendChild(zoomContainer);

const wfContainer = document.createElement("div");
document.body.appendChild(wfContainer);

const hfContainer = document.createElement("div");
document.body.appendChild(hfContainer);

const fzContainer = document.createElement("div");
document.body.appendChild(fzContainer);

const afContainer = document.createElement("div");
document.body.appendChild(afContainer);

const viewContainer = document.createElement("div");
document.body.appendChild(viewContainer);


viewContainer.style.height = "400px";
viewContainer.style.width = "400px";
	
export {
	viewContainer as viewContainer, 
	zoomContainer as zoomContainer, 
	wfContainer as wfContainer,
	hfContainer as hfContainer,
	fzContainer as fzContainer,
	afContainer as afContainer,
	service as service, 
	store as store, 
	config as config
};
