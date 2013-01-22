var objects = {};
var ctx;
var width;
var height;
var border_radius;
var origin;
var cleanup = [];
var object_counter = 0;
var timestep_length = 50;

var border_id;
var player_id;
var player_width = 0.20;

jQuery(document).ready(function(){
	$(document).keydown(function(e){
		var key = (e.keyCode ? e.keyCode : e.charCode);
		if(key == 37){
			objects[player_id].vel[1] = 0.05;
		}
		else if(key == 39){
			objects[player_id].vel[1] = -0.05;
		}
	});
	$(document).keyup(function(e){
		var key = (e.keyCode ? e.keyCode : e.charCode);
		if(key == 37){
			if(objects[player_id].vel[1] > 0){
				objects[player_id].vel[1] = 0;
			}
		}
		else if(key == 39){
			if(objects[player_id].vel[1] < 0){
				objects[player_id].vel[1] = 0;
			}
		}
	});
});


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
	this.old_pos = [0,0];
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
	border_radius = width/2;

	origin = [border_radius,border_radius];
	ctx = canvas.getContext("2d");

	var border = new PolarObject(0,0,border_radius - 2,circleHandler,borderCollisionHandler);
	border_id = border.id;
	registerObject(border);
	var player = new PolarObject(0,0,50,playerHandler,function(){return;});
	player_id = player.id;
	registerObject(player);
	registerObject(new PolarObject(0,0,50,circleHandler,function(){return;}));
	registerObject(new PolarObject(0,0,20,circleHandler,flipperCollisionHandler));
	objects[2].vel = [5,0.05];
	objects[2].acc = [2,0.00];
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
	ctx.lineWidth = 2;
	var x = object.pos[0] * Math.cos(object.pos[1]);
	var y = object.pos[0] * Math.sin(object.pos[1]);
	context.arc(x,y,object.size,0,Math.PI*2,true);	
	ctx.stroke();
}

function playerHandler(context,object){
	ctx.beginPath();
	ctx.strokeStyle = "blue";
	ctx.lineWidth = 9;
	var x = objects[border_id].pos[0] * Math.cos(objects[border_id].pos[1]);
	var y = objects[border_id].pos[0] * Math.sin(objects[border_id].pos[1]);
	context.arc(x,y,objects[border_id].size,object.pos[1] + player_width,object.pos[1] - player_width,true);	
	ctx.stroke();
}

function borderCollisionHandler(border,collider){
	if(getAngularDistance(collider.pos[1], objects[player_id].pos[1]) < player_width){
		collider.vel[0] *= -1.5;
		collider.vel[1] *= 0.0;
		collider.pos[0] = border.size - collider.size - 1;
	}
	else{
		collider.vel[0] *= -0.9;
		collider.vel[1] *= 0.9;
		collider.pos[0] = border.size - collider.size - 1;
	}
}

function flipperCollisionHandler(object,collider){
	console.log(collider.id + "," + collider.old_pos + "," + collider.pos);
	if(collider.old_pos[0] < object.size){
		//we've already flipped this fella
		return;
	}
	else{
		collider.pos[0] *= -1;
		collider.vel[0] *= -1;
		collider.old_vel[0] *= -1;
		collider.acc[0] *= -1;
		collider.old_acc[0] *= -1;

		collider.pos[1] += Math.PI;
	}
}

function mod(a,b){
	if(a >= 0) return a % b;
	var result = b + (a % b);
	return result;
}

function getAngularDistance(a,b){
	if(b < a){
		var temp = a;
		a = b;
		b = temp;
	}
	return Math.min(Math.abs(a-b),mod(a-b,2*Math.PI));
}

function timestep(delta){
	for(var key in objects){
		if(objects.hasOwnProperty(key)){
			objects[key].old_pos = objects[key].pos.slice();
			objects[key].old_vel = objects[key].vel.slice();
			objects[key].vel[0] += delta/timestep_length * objects[key].acc[0];
			objects[key].vel[1] += delta/timestep_length * objects[key].acc[1];
			objects[key].pos[0] += delta/timestep_length * (objects[key].vel[0] + objects[key].old_vel[0])/2;
			objects[key].pos[1] += delta/timestep_length * (objects[key].vel[1] + objects[key].old_vel[1])/2;
			objects[key].pos[1] = mod(objects[key].pos[1],2*Math.PI);
		}
	}
	//resolve collisions
	for(var key in objects){
		if(objects.hasOwnProperty(key)){
			if(key != border_id){
				for(var other in objects){
					if(objects.hasOwnProperty(other) && other != border_id && other != key){
						var other_r = objects[other].pos[0];
						var obj_r = objects[key].pos[0];
						var other_theta = objects[other].pos[1];
						var obj_theta = objects[key].pos[1];
						var distance = Math.sqrt(other_r*other_r + obj_r*obj_r - 2*other_r*obj_r*Math.cos(obj_theta - other_theta));
						if(distance < Math.abs(objects[other].size - objects[key].size)){
							objects[key].handleCollision(objects[other]);
						}
					}
				}
			}
		}
	}

	//check for game border collisions
	for(var key in objects){
		if(objects.hasOwnProperty(key)){
			if(key != border_id){
				if(Math.abs(objects[key].pos[0]) + objects[key].size > border_radius){
					objects[border_id].handleCollision(objects[key]);
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