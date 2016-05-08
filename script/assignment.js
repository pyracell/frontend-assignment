function init() {
	// Upload button with handler
	var uploadImage = document.getElementById('uploadImageBtn');
    uploadImage.addEventListener('change', addImage, false); 
    
    var tileArr = []; //Populated be workerMessageHandler. Holding data for drawing
    var tileWidth, tileHeight, tileData, //Tile information
    imgCanvas, 
    xCount, yCount, //initial counts. Used as base values
    xCountTemp, yCountTemp, //these count are changed every loop, and will be reset when needed, using the initial counts
    row;
    var img; //Initial image obj
    var w; //Worker obj
    var messageCounter;


    /**  
	 * Called by upload listener, this function objectify the image. start the worker and initialize the analysis.
	 * @param {obj} upload event, passed by the eventlistener
     */
	function addImage(evt) {
		if(evt.target.files[0].type === "image/png") {
			//Making sure older browsers will get an error, due to the lack of Worker
			if(typeof(Worker) !== 'undefined') {
				var reader = new FileReader();
				reader.onload = function(event) {
					img = new Image();
					img.onload = function() {
						//Instantiating the worker + adding the eventListener to receive messages from the worker.
						w = new Worker('script/imageAnalyzer.js');
						w.addEventListener('message', workerMessageHandler);
						
						//Counter to know when all calculations are back from the worker. Just initializing it here.
						messageCounter = 0;
						//Analysis started.
						imageAnalysis();
					}
					//Giving the image a src
					img.src = event.target.result;
				}
				//Reading the incoming file
				reader.readAsDataURL(evt.target.files[0]);
			} else {
				alert('No web worker support. Your browser is to old.')
			}
		} else {
			alert('Please choose a PNG-file for analysis.');
		}
		
	};

	/**  
	 * Analyzes the image, by splitting it into 10 row, with each 10 columns.
	 * This function control the contact the the worker.
     */
	function imageAnalysis() {
		imgCanvas = document.createElement('canvas');
		imgCanvas.height = img.height;
		imgCanvas.width = img.width;
		var imgCtx = imgCanvas.getContext('2d');
		imgCtx.drawImage(img, 0, 0);

		//Initial counts. These are the spare pixels, otherwise ending up as decimals.
		//Instead these will be added on width and height accordingly to make sure every pixel is attended.
		xCount = img.width % 10;
		yCount = img.height % 10;

		//Tile dimensions. Without decimals due to the above.
		tileWidth = (img.width - xCount) / 10;
		tileHeight = (img.height - yCount) / 10;
		
		//Temp count is set for the loop ahead
		yCountTemp = yCount;		
		// For each row
		for(var y = 0; y < 10; y++){
			//Temp count is set for the loop ahead
			xCountTemp = xCount;
			// For each column in the row
			for(var x = 0; x < 10; x++){
				//Fetching imagedata for a specific tile, given by x/y start positions and width/height.
				tileData = imgCtx.getImageData(x * tileWidth, y * tileHeight, tileWidth + (xCountTemp > 0  ? 1 : 0), tileHeight + (yCountTemp > 0  ? 1 : 0));
				var data = tileData.data;

				//Sending instructions to the worker
				w.postMessage({data: data, y: y, x: x});
				//Reducing the count, to make sure we don't exceed the pixel width of the image
				xCountTemp--;
			}
			//Reducing the count, to make sure we don't exceed the pixel height of the image
			yCountTemp--;
		}
	};

	/**  
	 * Event based function, called by the listener, when the worker is done processing the data.
	 * @param {obj} Message from worker, for theTileArr {x, y, result}
     */
	function workerMessageHandler(msg) {
		//If an array isn't present at the given position, such will be created
		if(typeof tileArr[msg.data.y] === 'undefined')
			tileArr[msg.data.y] = [];

		//Populating the tileArr with the data from the worker
		tileArr[msg.data.y][msg.data.x] = msg.data.result;
		//Counter incrementation
		messageCounter++;
		//When reaching 100, all results have been processed
		if(messageCounter === 100) {
			//Terminating the worker
			w.terminate();
			//Drawing
			drawVisualExample();
		}
	};

	/**  
	 * Called when all data has been processed and collected, this function the draw the result on a canvas, and add it to the DOM
     */
	function drawVisualExample() {
		exCanvas = document.createElement('canvas');
		exCanvas.height = imgCanvas.height;
		exCanvas.width = imgCanvas.width;
		var exCtx = exCanvas.getContext('2d');
		
		var style;
		//Loops are almost identical with the one in the image analysis
		yCountTemp = yCount;
		for(var y = 0; y < 10; y++) {
			row = tileArr[y];
			xCountTemp = xCount;
			for(var x = 0; x < 10; x++) {
				//Begin drawing
				exCtx.beginPath();
				exCtx.rect(x * tileWidth, y * tileHeight, tileWidth + (xCountTemp > 0  ? 1 : 0), tileHeight + (yCountTemp > 0  ? 1 : 0));
				//Determines the color of the tile by the result from the worker
				(row[x] === 1 ? style = 'red' : style = 'green');
				exCtx.fillStyle = style;
				exCtx.fill();
				exCtx.stroke();
			}
		}
		//Emptying the container, then appending the canvas
		var exampleContainer = document.getElementById('exampleContainer');
		exampleContainer.innerHTML = "";
		exampleContainer.appendChild(exCanvas);
	};
}

$(document).ready(function() {
	init();
});