export function setRealViewPort(realViewPort) {
	return {
		type: "SET_REAL_VIEWPORT",
		realViewPort: realViewPort
	};
}

export function sendMouseWheel(wheelState) {
	return {
		type: "SEND_MOUSEWHEEL",
		mousewheel: wheelState
	};
}

export function setFill(mode) {
	return {
		type: "SET_FILL",
		mode: mode
	};
}

export function setFreeMovement(mode) {
	return {
		type: "SET_FREE_MOVEMENT",
		mode: mode
	};
}


