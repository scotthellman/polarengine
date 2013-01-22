
var PolarEngine = (function() {
	var objects = {};
	var ctx;
	var width;
	var height;
	var border_radius = 400;
	var origin = [400,400];
	var cleanup = [];
	var object_counter = 0;
	var debug = true;

	var border_id;
	var player_id;
	var player_width = 0.20;
	var timestep_length;
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

	function init(canvas) {
		canvas.width = 800;
		canvas.height = 800;
		width = canvas.width;
		height = canvas.height;
		border_radius = width/2;
		origin = [border_radius,border_radius];
		ctx = canvas.getContext("2d");
		previous_time = new Date().getTime();
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
		context.beginPath();
		context.strokeStyle = "black";
		context.lineWidth = 2;
		var x = object.pos[0] * Math.cos(object.pos[1]);
		var y = object.pos[0] * Math.sin(object.pos[1]);
		context.arc(x,y,object.size,0,Math.PI*2,true);	
		context.stroke();
		if(debug){
			context.beginPath();
			context.moveTo(x,y);
			context.lineWidth = 1;
			var next_x = (object.vel[0] + object.pos[0]) * Math.cos(object.pos[1] + object.vel[1]);
			var next_y = (object.vel[0] + object.pos[0]) * Math.sin(object.pos[1] + object.vel[1]);
			context.lineTo(next_x,next_y);
			context.stroke();
			context.beginPath();
			context.moveTo(x,y);
			context.lineWidth = 4;
			context.strokeStyle = "blue";
			context.lineTo(x + 25*Math.cos(object.pos[1]),y+25*Math.sin(object.pos[1]));
			context.stroke();
		}
	}


	function borderCollisionHandler(border,collider){
		if(collider.pos[0] < 0){
			collider.pos[0] = -1;
			collider.pos[1] += Math.PI;
		}
		if(getAngularDistance(collider.pos[1], objects[PolarEngine.player_id].pos[1]) < player_width){
			collider.vel[0] *= -1.5;
			collider.vel[1] = collider.vel[1]*0.5 + objects[PolarEngine.player_id].vel[1];
			collider.pos[0] = border.size - collider.size - 1;
		}
		else{
			collider.vel[0] *= -0.9;
			collider.vel[1] *= 0.9;
			collider.pos[0] = border.size - collider.size - 1;
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
				objects[key].vel[0] += delta/PolarEngine.timestep_length * objects[key].acc[0];
				objects[key].vel[1] += delta/PolarEngine.timestep_length * objects[key].acc[1];
				objects[key].pos[0] += delta/PolarEngine.timestep_length * (objects[key].vel[0] + objects[key].old_vel[0])/2;
				objects[key].pos[1] += delta/PolarEngine.timestep_length * (objects[key].vel[1] + objects[key].old_vel[1])/2;
				objects[key].pos[1] = mod(objects[key].pos[1],2*Math.PI);
			}
		}
		//resolve collisions
		for(var key in objects){
			if(objects.hasOwnProperty(key)){
				if(key != PolarEngine.border_id){
					for(var other in objects){
						if(objects.hasOwnProperty(other) && other != PolarEngine.border_id && other != key){
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
				if(key != PolarEngine.border_id){
					if(Math.abs(objects[key].pos[0]) + objects[key].size > PolarEngine.border_radius){
						objects[PolarEngine.border_id].handleCollision(objects[key]);
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

	return {
		init : init,
		update : updateWorld,
		PolarObject : PolarObject,
		register : registerObject,
		circleHandler : circleHandler,
		borderCollisionHandler : borderCollisionHandler,
		player_id : player_id,
		border_id : border_id,
		border_radius : border_radius,
		player_width : player_width,
		timestep_length : timestep_length
	}
})();
