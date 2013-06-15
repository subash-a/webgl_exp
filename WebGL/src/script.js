/*
* Javascript File.
*/
var canvas;
var gl;
var cubeVerticesBuffer;
var cubeVertices;
var vertexPositionAttribute;
var vertexTextureAttribute;
var shaderProgram;
var perspectiveMatrix;
var mvMatrix;
var y_deg = 0;
var z_deg = 0;
var x_deg = 0;
var z_translate = 0;
var x_translate = 0;
var y_translate = 0;
var cubeTexture;
var window_height = 320;
var window_width = 480;
var curr_pos;
var n_pos = false;
var netchart;
var temperature = 12.50;
var humidity = 18.0;
var pressure = 100.3;
var air_density = 1.249;

function start() {
    canvas = document.getElementById("glcanvas");
    canvas.width = window_width;
    canvas.height = window_height;

    loadPositions();

    $('#y-rotation').on('change',rotateCubeY);

    $('#z-rotation').on('change',rotateCubeZ);

    $('#x-rotation').on('change',rotateCubeX);

    $('#x-translate').on('change',translateCubeX);

    $('#y-translate').on('change',translateCubeY);

    $('#z-translate').on('change',translateCubeZ);
    


    $('#row-one').delegate('div .server','click',function(e){
	$('div.server').removeClass('srv-selected');
	$(e.currentTarget).addClass('srv-selected');
	var location = $(e.currentTarget).attr('location');
	setNewPosition(location);
    });

    $('#row-two').delegate('div .server','click',function(e){
	$('div.server').removeClass('srv-selected');
	$(e.currentTarget).addClass('srv-selected');
	var location = $(e.currentTarget).attr('location');
	setNewPosition(location);
    });

    $('#srv-box-container').delegate('div.rack','click',function(e){
	$('div.rack').removeClass('rack-selected');
	$(e.currentTarget).addClass('rack-selected');
	var model = $(e.currentTarget).attr('model');
	showServerData(getServerData(model));
    });
    
    $('#ubn').on('click',moveUp);
    $('#dbn').on('click',moveDown);
    $('#rbn').on('click',moveRight);
    $('#lbn').on('click',moveLeft);
    $('#cw').on('click',rotateClock);
    $('#acw').on('click',rotateAntiClock);
    
    initgl(canvas);
    
    if(gl) {
	gl.clearColor(0.90, 0.90, 0.90, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	
	initShaders();
	
	initBuffers();
	
	initTextures();

	initCharts();

	initSlider();

	setInterval(drawScene, 50);
	
	setInterval(updateCharts,1000);

	setInterval(updateAtmosphere,5000);

    }
    
}

function initCharts() {
    netchart = new Highcharts.Chart({
	chart:{
	    type:'line',
	    renderTo:'net-act'
	},
	title:{
	    text:''
	},
	xAxis:{
	    type:'datetime',
	    gridLineWidth:1
	},
	plotOptions:{
	    line:{
		marker:{enabled:false}
	    }
	},
	yAxis:{
	    title:{
		text:'Gbps'
	    },
	    min:-0.25,
	    max:1.25
	},
	series:[{
	    name:'Data',
	    data:chartData()
	}]
    });

    cpuchart = new Highcharts.Chart({
	chart:{
	    type:'bar',
	    renderTo:'cpu-act'
	},
	title:{
	    text:""
	},
	xAxis:{
	    categories:["Server","Application","Users"]
	    
	},
	yAxis:{
	    min:0,
	    max:120
	},
	series:[{name:"CPU",data:[80,30,13]},{name:"Memory",data:[400,190,70]}]
    });
}

function chartData() {
    var data = [];
    var time = (new Date()).getTime();
    for(i=-20;i<0;i++) {
	data.push({
	    x:time+i*200,
	    y:Math.random()	    
	});
    }
    return data;
}

function initgl(canvas) {
    gl = null;
    try {
	gl = canvas.getContext("experimental-webgl");
    }
    catch(e) {
	console.error(e);
    }
    
    if(!gl){
	console.error("unable to initialize Web GL");
    }
   
    
} 

function initBuffers() {
   /* var vertices = [];
    function fillBuffers(result) {
	vertices = result.data.vertex_array;
	cubeVertices = result.data.index_array;
    }
    function onFailure(xhr) {

    }
    $.ajax({
	url:'data/cube_data.json',
	type:'GET',
	dataType:'json',
	async:false,
	success:fillBuffers,
	error:onFailure
    });
*/
    var rows = 2;
    var num_of_cubes = 5;
    
    cubeVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesBuffer);
    var vertices = generateVertices(num_of_cubes,rows);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cubeVertexIndexBuffer);
    var cubeVertices = generateIndices(num_of_cubes,rows);
    cubeVertexIndexBuffer.size = cubeVertices.length;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertices),gl.STATIC_DRAW);

/*    cubeVertexColors = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,cubeVertexColors);

    var cubeColors = [ [1.0,0.0,0.0,1.0],
		       [0.0,1.0,0.0,1.0],
		       [0.0,0.0,1.0,1.0],
		       [0.0,1.0,0.0,1.0],
		       [1.0,0.0,0.0,1.0],
		       [0.0,0.0,1.0,1.0]

    ];
    
    generatedColors = [];

    for(i=0;i<6;i++){
	
	var c = cubeColors[i];
	for( j=0;j<4;j++) {
	    generatedColors = generatedColors.concat(c);
	}
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(generatedColors),gl.STATIC_DRAW);*/

    cubeVerticesTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesTextureCoordBuffer);
    /*var textureCoords = [0.0,0.0,
			 0.25,0.0,
			 0.25,0.5,
			 0.0,0.5,

			 0.25,0.0,
			 0.5,0.0,
			 0.5,0.5,
			 0.25,0.5,

			 0.5,0.0,
			 0.75,0.0,
			 0.75,0.5,
			 0.5,0.5,
			 
			 0.75,0.0,
			 1.0,0.0,
			 1.0,0.5,
			 0.75,0.5,

			 0.0,0.5,
			 0.5,0.5,
			 0.5,1.0,
			 0.0,1.0,

			 0.5,0.5,
			 1.0,0.5,
			 1.0,1.0,
			 0.5,1.0


			];

*/


    var textureCoords =  [// Front
0.0, 0.0,
1.0, 0.0,
1.0, 1.0,
0.0, 1.0,
// Back
0.0, 0.0,
1.0, 0.0,
1.0, 1.0,
0.0, 1.0,
// Top
0.0, 0.0,
1.0, 0.0,
1.0, 1.0,
0.0, 1.0,
// Bottom
0.0, 0.0,
1.0, 0.0,
1.0, 1.0,
0.0, 1.0,
// Right
0.0, 0.0,
1.0, 0.0,
1.0, 1.0,
0.0, 1.0,
// Left
0.0, 0.0,
1.0, 0.0,
1.0, 1.0,
0.0, 1.0

    ];

    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(textureCoords),gl.STATIC_DRAW);

}

function initTextures() {
    cubeTexture = gl.createTexture();
    cubeImage  = new Image();
    cubeImage.onload = function() {handleTextureLoaded(cubeImage,cubeTexture)};
    cubeImage.src = "carbon_tex.jpg";
}

function handleTextureLoaded(image,texture) {
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D,null);
}

function drawScene() {
    

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    perspectiveMatrix = makePerspective(45, window_width/window_height, 0.1, 100.0);
    loadIdentity();

    if(n_pos){
	change_position();
    }

    mvTranslate([-0.0, -0.0, -1.0*0.25*z_translate]);
    mvTranslate([-0.0, -1.0*0.25*y_translate, -0.0]);
    mvTranslate([-1.0*0.25*x_translate, -0.0, -0.0]);
    mvRotate(y_deg,[0.0,1.0,0.0]);
    mvRotate(z_deg,[0.0,0.0,1.0]);
    mvRotate(x_deg,[1.0,0.0,0.0]);
    mvPushMatrix();


    
   
    gl.bindBuffer(gl.ARRAY_BUFFER,cubeVerticesBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3,gl.FLOAT,false,0,0);

    gl.vertexAttribPointer(vertexTextureAttribute,2,gl.FLOAT,false,0,0);

    //gl.bindBuffer(gl.ARRAY_BUFFER,cubeVertexColors);
    //gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0 , 0);

   
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cubeVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES,cubeVertexIndexBuffer.size, gl.UNSIGNED_SHORT, 0);
   
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,cubeTexture);
    gl.uniform1i(gl.getUniformLocation(shaderProgram,"uSampler"),0);
    
    
    
    //gl.drawArrays(gl.TRIANGLE_STRIP,8,4);
    //gl.drawArrays(gl.TRIANGLE_STRIP,12,4);
    //gl.drawArrays(gl.TRIANGLE_STRIP,16,4);
    //gl.drawArrays(gl.TRIANGLE_STRIP,22,4);
    

}

function initSlider() {
    $('#temp-slider').slider({
	orientation:"vertical",
	range:"min",
	min:0,
	max:25,
	value:15,
	step:0.25,
	slide:function(e,ui){
	    temperature = ui.value;
	    humidity = temperature*(36/25);
	    pressure = 100.00+temperature*(1.325/25);
	    air_density = 1.249-temperature*(1.1839/25);
	    $('#temp-deg').html(parseFloat(ui.value).toFixed(2));
	    $('#hum-deg').html(parseFloat(humidity).toFixed(2));
	    $('#prs-deg').html(parseFloat(pressure).toFixed(2));
	    $('#aid-deg').html(parseFloat(air_density).toFixed(2));
	}
    });
}
function updateCharts() {
    netchart.series[0].addPoint([(new Date()).getTime(),Math.random()],true,true);
    cpuchart.series[0].points[0].update(80+Math.random()*20,true,true);
    cpuchart.series[0].points[1].update(40+Math.random()*10,true,true);
    cpuchart.series[0].points[2].update(20+Math.random()*15,true,true);
    cpuchart.series[1].points[0].update(50+Math.random()*50,true,true);
    cpuchart.series[1].points[1].update(20+Math.random()*20,true,true);
    cpuchart.series[1].points[2].update(15+Math.random()*15,true,true);
    $("#rack-cpu").width(Math.random()*100+'%');
    $("#rack-mem").width(Math.random()*100+'%');
}

function updateAtmosphere() {
    var delta = Math.random()*0.1;
    temperature += delta;
    humidity += delta*4;
    pressure += delta*(1.325/25);
    air_density -= delta*(1.189/25);
    $('#temp-deg').html(temperature.toFixed(2));
    $('#hum-deg').html(humidity.toFixed(2));
    $('#prs-deg').html(pressure.toFixed(3));
    $('#aid-deg').html(air_density.toFixed(2));
    $('#temp-indicator div.inner-indicator').height(100-((100*temperature)/25)+"%");
    $('#hum-indicator div.inner-indicator').height(100-((100*humidity)/31.0)+"%");
    $('#prs-indicator div.inner-indicator').height(100-((100*(pressure-100))/1.325)+"%");
    $('#aid-indicator div.inner-indicator').height(100-((100*air_density)/1.340)+"%");
}

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");
    
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    
    var link_status = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	alert("Shader program initialization failed");
    }

    gl.useProgram(shaderProgram);
    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  //  vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    vertexTextureAttribute = gl.getAttribLocation(shaderProgram,"aTextureCoord");
    

    gl.enableVertexAttribArray(vertexPositionAttribute);
//    gl.enableVertexAttribArray(vertexColorAttribute);
    gl.enableVertexAttribArray(vertexTextureAttribute);
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if(!shaderScript) {
	return null;
    }

    var source = "";
    var currentChild = shaderScript.firstChild;
    while(currentChild) {
	if(currentChild.nodeType === 3) {
	    source += currentChild.textContent;
	}
	currentChild = currentChild.nextSibling;
    }
    
    var shader;

    if(shaderScript.type === "x-shader/x-fragment") {
	shader = gl.createShader(gl.FRAGMENT_SHADER);
    }
    else if(shaderScript.type === "x-shader/x-vertex") {
	shader = gl.createShader(gl.VERTEX_SHADER);
    }
    else {
	return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var compile_status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	console.error("Error occured while compiling Shaders"+gl.getShaderInfoLog(shader));
	return null;
    }
    
    return shader;
}


function loadIdentity() {
    mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
    mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
    multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
    var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));

}

var mvMatrixStack = [];

function mvPushMatrix(m) {
    if(m) {
	mvMatrixStack.push(m.dup());
	mvMatrix = m.dup();
    }
    else {
	mvMatrixStack.push(mvMatrix.dup());
    }
}

function mvPopMatrix() {
    if(!mvMatrixStack.length) {
	throw("Cannot pop from empty stack");
    }
    mvMatrix = mvMatrixStack.pop();
    return mvMatrix;
}

function mvRotate(angle, v) {
    var inRadians = angle * Math.PI / 180.0;
    
    var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
    multMatrix(m);
}

function rotateCubeY(e) {
    y_deg = e.currentTarget.value;
   
}

function rotateCubeZ(e) {
    z_deg = e.currentTarget.value;
   
}

function rotateCubeX(e) {
    x_deg = e.currentTarget.value;
}

function translateCubeX(e) {
    x_translate = e.currentTarget.value;
}

function translateCubeY(e) {
    y_translate = e.currentTarget.value;
}

function translateCubeZ(e) {
    z_translate = e.currentTarget.value;
}

function moveUp(e){
    y_translate += 1;
}
function moveDown(e){
    y_translate -= 1;
}
function moveRight(e){
    x_translate += 1;
}
function moveLeft(e){
    x_translate -= 1;
}
function rotateClock(e) {
    y_deg += 5;
}

function rotateAntiClock(e) {
    y_deg -= 5;
}

function generateIndices(rows,num_of_cubes) {
    var cubeVertices = [];
    /*var vertex_num = (6*num_of_cubes)*4*rows;
    
    for(l=0;l<vertex_num;l+=4) {
	cubeVertices = cubeVertices.concat(l,l+1,l+2,l,l+2,l+3);
    }
    */
//  document.write("<div>"+cubeVertices+"</div");

    function onSuccess(data) {
	cubeVertices = data.indices;
    }

    function onError(xhr) {
	console.error('Could not load indices');
    }

    $.ajax({
	url:'data/vertex_index.json',
	type:'GET',
	dataType:'json',
	async:false,
	success:onSuccess,
	error:onError
    });

    return cubeVertices;
}

function generateVertices(num_of_cubes,rows) { 
    var vertices = [];
   /* var x_offset = -2.0;
    var row = 0;
    for( m=0;m<rows;m++) {
	row = row+3;
	x_offset = -2.0;
	for(k=0;k<num_of_cubes;k++) {
	    
	    x_offset = x_offset+2.0;
	    
	    vertices = vertices.concat(-0.5+x_offset,-1.5,row+1.0,
				       0.5+x_offset,-1.5,row+1.0,
				       0.5+x_offset,1.5,row+1.0,
				       -0.5+x_offset,1.5,row+1.0,
				       
				       //Ba+x_offsetck face
				       -0.5+x_offset,-1.5,-1.0+row,
				       -0.5+x_offset,1.5,-1.0+row,
				       0.5+x_offset,1.5,-1.0+row,
				       0.5+x_offset,-1.5,-1.0+row,
				       
				       //to+x_offsetp face
				       -0.5+x_offset,1.5,-1.0+row,
				       -0.5+x_offset,1.5,1.0+row,
				       0.5+x_offset,1.5,1.0+row,
				       0.5+x_offset,1.5,-1.0+row,
				       
				       //bo+x_offsetttom face
				       -0.5+x_offset,-1.5,-1.0+row,
				       -0.5+x_offset,-1.5,1.0+row,
				       0.5+x_offset,-1.5,1.0+row,
				       0.5+x_offset,-1.5,-1.0+row,
				       
				       //ri+x_offsetght face
				       0.5+x_offset,-1.5,-1.0+row,
				       0.5+x_offset,-1.5,1.0+row,
				       0.5+x_offset,1.5,1.0+row,
				       0.5+x_offset,1.5,-1.0+row,
				       
				       //LE+x_offsetFT FACE
				       -0.5+x_offset,-1.5,-1.0+row,
				       -0.5+x_offset,-1.5,1.0+row,
				       -0.5+x_offset,1.5,1.0+row,
				       -0.5+x_offset,1.5,-1.0+row
				      );
	}

    }
*/
    /*Dynamic Loading from files*/
    function onSuccess(data) {
	vertices = data.vertices;
    }

    function onError(xhr) {
	console.error('Failed to fetch model data');
    }

    $.ajax({
	url:'data/5x2servers.json',
	type:'GET',
	dataType:'json',
	async:false,
	success:onSuccess,
	error:onError
    });

    return vertices;
    //document.write("<div>"+vertices+"</div>");
}

function loadPositions() {
    function onSuccess(result) {
	positions = result.data.servers;
	curr_pos = positions[0];
	n_pos = true;
    }

    function onFailure(xhr) {

    }

    $.ajax({
	url:'data/positions.json',
	type:'GET',
	dataType:'json',
	async:false,
	success:onSuccess,
	error:onFailure
    });
}

function change_position() {
    var xtflag = changePositionX(curr_pos.translate[0]);
    var ytflag = changePositionY(curr_pos.translate[1]);
    var ztflag = changePositionZ(curr_pos.translate[2]);
    var xrflag = changeRotationX(curr_pos.rotation[0]);
    var yrflag = changeRotationY(curr_pos.rotation[1]);
    var zrflag = changeRotationZ(curr_pos.rotation[2]);

    if(xtflag && ytflag && ztflag && xrflag && yrflag && zrflag) {
	n_pos = false;
    }
    
}

function changePositionX(n_val) {
    if(x_translate > n_val) {
	x_translate--;
	return false;
    }
    if(x_translate < n_val) {
	x_translate++;
	return false;
    }
    return true;
    
}

function changePositionY(n_val) {
    if(y_translate > n_val) {
	y_translate--;
	return false;
    }
    if(y_translate < n_val) {
	y_translate++;
	return false;
    }
    return true;
    
}

function changePositionZ(n_val) {
    if(z_translate > n_val) {
	z_translate--;
	return false;
    }
    if(z_translate < n_val) {
	z_translate++;
	return false;
    }
    return true;
    
}

function changeRotationX(n_val) {
    if(x_deg > n_val) {
	x_deg--;
	return false;
    }
    if(x_deg < n_val) {
	x_deg++;
	return false;
    }
    return true;
    
}

function changeRotationY(n_val) {
    if(y_deg > n_val) {
	y_deg--;
	return false;
    }
    if(y_deg < n_val) {
	y_deg++;
	return false;
    }
    return true;
    
}

function changeRotationZ(n_val) {
    if(z_deg > n_val) {
	z_deg--;
	return false;
    }
    if(z_deg < n_val) {
	z_deg++;
	return false;
    }
    return true;
    
}

function setNewPosition(location){
    n_pos = true;
    curr_pos = positions[location];
}

function getServerData(model){
    var htmlContent = "";
    switch(model) {
    case "DELL":htmlContent = "<span class='desc-text'>DELL Power Edge 1850</span><span class='desc-text'>SCore 64-bit Intel Xeon 3.8GHz</span><span class='desc-text'>800 MHz</span><span class='desc-text'>Upto 2MB L2 per Processor Core</span><span class='desc-text'>Intel E7520</span><span class='desc-text'>16GB of Dual rank 4GB DIMM's</span><span class='desc-text'>550W, optional hot-plug redundant power</span><span class='desc-text'>Intel PRO/1000 MT Gigabit</span><span class='desc-text'>Embedded ATI Radeon 7000-M with 16MB SDRAM</span>";
	break;
    case "IBM":htmlContent = "<span class='desc-text'>IBM x3200 M3</span><span class='desc-text'>QCore Intel Xenon 3400 Series</span><span class='desc-text'>1024 MHz</span><span class='desc-text'>Upto 4MB L3 per Processor Core</span><span class='desc-text'>Intel E7520</span><span class='desc-text'>16GB of Dual rank 4GB DIMM's</span><span class='desc-text'>550W, optional hot-plug redundant power</span><span class='desc-text'>Dual Gigabit Ethernet</span><span class='desc-text'>Embedded ATI Radeon 7000-M with 16MB SDRAM</span>";
	break;
    case "HP":htmlContent = "<span class='desc-text'>HP Proliant DL320e</span><span class='desc-text'>Quad Core Intel Xeon E3-1200v2</span><span class='desc-text'>800 MHz</span><span class='desc-text'>Upto 2MB L2 per Processor Core</span><span class='desc-text'>Intel E7520</span><span class='desc-text'>32GB of Dual rank 4GB DIMM's</span><span class='desc-text'>550W, optional hot-plug redundant power</span><span class='desc-text'>Intel PRO/1000 MT Gigabit</span><span class='desc-text'>Embedded ATI Radeon 7000-M with 16MB SDRAM</span>";
	break;
    default:htmlContent = "<span class='desc-text'>DELL Power Edge 1850</span><span class='desc-text'>64-bit Intel Xeon 3.8GHz</span><span class='desc-text'>800 MHz</span><span class='desc-text'>Upto 2MB L2 per Processor Core</span><span class='desc-text'>Intel E7520</span><span class='desc-text'>16GB of Dual rank 4GB DIMM's</span><span class='desc-text'>550W, optional hot-plug redundant power</span><span class='desc-text'>Intel PRO/1000 MT Gigabit</span><span class='desc-text'>Embedded ATI Radeon 7000-M with 16MB SDRAM</span>";
	break;

    }
    return htmlContent;
}

function showServerData(structure) {
    $('#desc-section').html(structure);
}
