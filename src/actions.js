export function setRealViewPort(realViewPort) {
	return {
		type: "SET_REAL_VIEWPORT",
		realViewPort: realViewPort
	}
}

export function sendMouseWheel(wheelState) {
	return {
		type: "SEND_MOUSEWHEEL",
		mousewheel: wheelState
	}
}