var objects = {};
var ctx;
var width;
var height;

var origin;

var cleanup = [];

var object_counter = 0;

var timestep_length = 50;

function getNewObjectID(){
	return object_counter++;
}

function PolarObject(r,theta,drawn_radius,drawHandler,collisionHandler){
	this.id = getNewObjectID();
	this.r = r;
	this.theta = theta;
	this.pos = [r,theta];
	this.vel = [0,0];
	this.acc = [0,0];
	this.old_vel = [0,0];
	this.old_acc = [0,0];
	this.size = drawn_radius;
	this.drawHandler = function(ctx){drawHandler(ctx,this)};
	this.handleCollision = function(collider){collisionHandler(this,collider)};
}

function init() {
    var canvas = document.getElementById("gradient");
    canvas.width = 800;
    canvas.height = 800;
    width = canvas.width;
    height = canvas.height;

    origin = [400,400];
    ctx = canvas.getContext("2d");

    registerObject(new PolarObject(0,0,50,function(ctx,object){circleHandler(ctx,object)},function(){return;}));
    registerObject(new PolarObject(0,0,width/2,function(ctx,object){circleHandler(ctx,object)},borderCollisionHandler));
    objects[0].vel = [5,0.025];
    objects[0].acc = [2,0.00];
    previous_time = new Date().getTime();
    return setInterval(updateWorld, timestep_length);
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

function circleHandler(context,object){
	ctx.beginPath();
	ctx.strokeStyle = "black";
	var x = object.pos[0] * Math.cos(object.pos[1]);
	var y = object.pos[0] * Math.sin(object.pos[1]);
	context.arc(x,y,object.size,0,Math.PI*2,true);	
	ctx.stroke();
}

function borderCollisionHandler(object,collider){
	collider.vel[0] *= -0.9;
	collider.vel[1] *= 0.9;
	collider.pos[0] = object.size - collider.size - 1;
}

function timestep(delta){
	for(var key in objects){
		if(objects.hasOwnProperty(key)){
			objects[key].vel[0] += delta/timestep_length * objects[key].acc[0];
			objects[key].vel[1] += delta/timestep_length * objects[key].acc[1];
			objects[key].pos[0] += delta/timestep_length * (objects[key].vel[0] + objects[key].old_vel[0])/2;
			objects[key].pos[1] += delta/timestep_length * (objects[key].vel[1] + objects[key].old_vel[1])/2;
			objects[key].pos[1] %= 2*Math.PI;
			objects[key].old_vel = objects[key].vel;
		}
	}
	//resolve collisions
	for(var key in objects){
		if(objects.hasOwnProperty(key)){
			for(var other in objects){
				if(objects.hasOwnProperty(other) && other != key){
					var other_r = objects[other].pos[0];
					var obj_r = objects[key].pos[0];
					var other_theta = objects[other].pos[1];
					var obj_theta = objects[key].pos[1];
					var distance = Math.sqrt(other_r*other_r + obj_r*obj_r - 2*other_r*obj_r*Math.cos(obj_theta - other_theta));
					if(distance > Math.abs(objects[other].size - objects[key].size)){
						objects[key].handleCollision(objects[other]);
					}
				}
			}
		}
	}
}

function updateWorld(){
	var delta = new Date().getTime() - previous_time; 
	timestep(delta);
	drawToCanvas();
    previous_time = new Date().getTime();
}