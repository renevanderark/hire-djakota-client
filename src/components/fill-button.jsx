import React from "react";
import HeightFillIcon from "./icons/height-fill";
import WidthFillIcon from "./icons/width-fill";
import AutoFillIcon from "./icons/auto-fill";
import { setFill } from "../api/actions";
import store from "../api/store";

const MOUSE_UP = 0;
const MOUSE_DOWN = 1;

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
                return <AutoFillIcon />
            case "heightFill":
                return <HeightFillIcon />
            case "widthFill":
            default:
                return <WidthFillIcon />
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
        )
    }
}

FillButton.propTypes = {
    scaleMode: function(props, propName, componentName) {
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


/*
<svg
  style="stroke:#000000;stroke-width:1px;stroke-opacity:1"
   viewBox="0 0 16 16">
    <g transform="rotate(90,8,8)">
        <path d="M 2.1,8.5 13.876786,8.5"/>
        <path d="M 14.2895,8.8224 10.876793,5.4933"/>
        <path d="M 1.5196504,8.7867 4.9323574,5.4576"/>
        <path d="M 14.27524,8.1261353 11.216057,11.258414" />
        <path d="M 1.5503841,8.1252136 4.3668137,11.302078" />
        <path d="m 15.386755,4.3822 0.01012,8.1302" />
        <path d="m 0.58963983,4.3191 0.010124,8.1302" />
  </g>
</svg>
*/