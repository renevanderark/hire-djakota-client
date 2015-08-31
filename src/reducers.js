
const initialState = {
	realViewPort: {
		x:0,y:0,w:0,h:0
	}
};

export default function(state = initialState, action) {

	switch(action.type) {
		case "SET_REAL_VIEWPORT":
			return {...state, realViewPort: {...state.realViewPort, ...action.realViewPort}};
		case "SEND_MOUSEWHEEL":
			return {...state, mousewheel: action.mousewheel};		
		default:
			return state;
	}
}