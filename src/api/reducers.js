
const initialState = {
	realViewPort: {x: 0, y: 0, w: 0, h: 0, zoom: 0, reposition: false},
	mousewheel: null,
	fillMode: null,
	freeMovement: false
};

export default function(state = initialState, action) {
	switch(action.type) {
		case "SET_REAL_VIEWPORT":
			return {...state, realViewPort: {...state.realViewPort, ...action.realViewPort}};
		case "SEND_MOUSEWHEEL":
			return {...state, mousewheel: action.mousewheel};
		case "SET_FILL":
			return {...state, fillMode: action.mode};
		case "SET_FREE_MOVEMENT":
			return {...state, freeMovement: action.mode};
		default:
			return state;
	}
}