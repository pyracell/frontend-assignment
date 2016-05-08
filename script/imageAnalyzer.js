/**
 * Worker Class - Analyzing incoming image data, whether or not the tile has transparency
 */

 /**
 * The function doing all the analysis work. Invoked by the eventListener
 */
function workwork(data, x, y) {
	//Preset result value incase no tranparency should be found
	var result = 1;
	//Running through the image data. Every pixel has four array positions. Three for colors and the fourth for transparency.
	//This is why I jump 4 at a time, alway looking at the last of these.
	for(var i=0;i<data.length;i+=4){
		//Everything below 255, is either completely transparent or at least slightly.
		if(data[i+3]<255){ 
			//Changing result value if transparency is found, and breaking the loop to save cpu cycles
			result = 0;
			break; 
		}
	}
	//When done, messaging the result to the 'handler'
	self.postMessage({x:x, y:y, result:result});
};

/**
 * Messages from the 'handler' will run through this listener. This will be data for analysis
 */
self.addEventListener('message', function(e) {
	workwork(e.data.data, e.data.x, e.data.y);
});