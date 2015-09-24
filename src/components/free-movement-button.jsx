import React from "react";
import FreeMovementIcon from "./icons/free-movement";
import { setFreeMovement } from "../api/actions";
import store from "../api/store";


class FreeMovementButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = store.getState();
    }

    componentDidMount() {
        this.unsubscribe = store.subscribe(() =>
            this.setState(store.getState())
        );
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    onClick() {
        store.dispatch(setFreeMovement(!this.state.freeMovement));
    }

    render() {
        let c = "hire-free-movement-button";
        if(!this.state.freeMovement) { c += " active" }
        return (
            <button className={c} onClick={this.onClick.bind(this)}>
                <FreeMovementIcon />
            </button>
        );
    }
}

export default FreeMovementButton;
