import React from "react";
import {DjatokaClient, Minimap, Zoom, FillButton, FreeMovementButton} from "./index";


class App extends React.Component {

	setMinimapDimensions(w, h) {
		document.querySelector("#minimap-wrap").style.width = w + 3 + "px";
		document.querySelector("#minimap-wrap").style.height = h + 3 + "px";
	}


	render() {
		return (
			<div id="hire-djatoka-client-app">
				<div id="minimap-wrap" style={{position: "absolute", zIndex: 1000, width: "120px", height: "120px"}}>
					<Minimap config={this.props.config} onDimensions={this.setMinimapDimensions.bind(this)} service={this.props.service} />
				</div>
				<div style={{height: "calc(100% - 50px)"}}>
					<DjatokaClient config={this.props.config} service={this.props.service} />
				</div>
				<div style={{height: "50px"}}>
					<Zoom />
					<FillButton scaleMode="widthFill" />
					<FillButton scaleMode="heightFill" />
					<FillButton scaleMode="fullZoom" />
					<FillButton scaleMode="autoFill" />
					<FreeMovementButton />
				</div>
			</div>
		);
	}
}

App.propTypes = {
	config: React.PropTypes.object,
	service: React.PropTypes.string
};

export default {
	mountNode: function(config, service, node) {
		React.render(<App config={config} service={service} />, node);
	},
	DjatokaClient: DjatokaClient,
	Minimap: Minimap,
	Zoom: Zoom,
	FillButton: FillButton,
	FreeMovementButton: FreeMovementButton
};