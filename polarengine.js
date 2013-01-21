var objects = {};
var ctx;
var width;
var height;

var origin;

var cleanup = [];

var object_counter = 0;

function getNewObjectID(){
	return object_counter++;
}

function PolarObject(r,theta,drawHandler){
	this.id = getNewObjectID();
	this.r = r;
	this.theta = theta;
	this.pos = [r,theta];
	this.vel = [0,0];
	this.drawHandler = drawHandler;
}

function init() {
    var canvas = document.getElementById("gradient");
    canvas.width = 800;
    canvas.height = 800;
    width = canvas.width;
    height = canvas.height;

    origin = [400,400];
    ctx = canvas.getContext("2d");

    registerObject(new PolarObject(40,0,circleHandler));
    objects[0].vel = [0.75,0.05];
    return setInterval(updateWorld, 50);
}

function registerObject(object){
	objects[object.id] = object;
}

function drawToCanvas() {
	ctx.save();
	ctx.clearRect(0,0,width,height);
	ctx.translate(origin[0],origin[1]);
	for (var key in objects) {
	    if (objects.hasOwnProperty(key)) {
	    	objects[key].drawHandler(ctx);
	    }
	}
	ctx.restore();
}


function circleHandler(context){
	circ_radius = 50;
	ctx.beginPath();
	ctx.strokeStyle = "black";
	var x = this.pos[0] * Math.cos(this.pos[1]);
	var y = this.pos[0] * Math.sin(this.pos[1]);
	context.arc(x,y,circ_radius,0,Math.PI*2,true);	
	ctx.stroke();
}

function timestep(){
	for(var key in objects){
		if(objects.hasOwnProperty(key)){
			objects[key].pos[0] += objects[key].vel[0];
			objects[key].pos[1] += objects[key].vel[1];
		}
	}
}

function updateWorld(){
	timestep();
	drawToCanvas();
}