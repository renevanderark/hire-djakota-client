import React from "react";
import HeightFillIcon from "./icons/height-fill";
import WidthFillIcon from "./icons/width-fill";
import AutoFillIcon from "./icons/auto-fill";
import { setFill } from "../api/actions";
import store from "../api/store";

const SUPPORTED_SCALE_MODES = [
    "heightFill",
    "widthFill",
    "autoFill",
    "fullZoom"
];


class FillButton extends React.Component {


    renderIcon() {
        switch(this.props.scaleMode) {
            case "fullZoom":
                return "100%";
            case "autoFill":
                return <AutoFillIcon />;
            case "heightFill":
                return <HeightFillIcon />;
            case "widthFill":
            default:
                return <WidthFillIcon />;
        }
    }

    onClick() {
        store.dispatch(setFill(this.props.scaleMode));
    }

    render() {
        return (
            <button className="hire-fill-button" onClick={this.onClick.bind(this)}>
                {this.renderIcon()}
            </button>
        );
    }
}

FillButton.propTypes = {
    scaleMode: function(props, propName) {
        if(SUPPORTED_SCALE_MODES.indexOf(props[propName]) < 0) {
            let msg = "Scale mode '" + props[propName] + "' not supported. Modes: " + SUPPORTED_SCALE_MODES.join(", ");
            props[propName] = "heightFill";
            return new Error(msg);
        }
    }
};

FillButton.defaultProps = {
    scaleMode: "heightFill"
};

export default FillButton;
