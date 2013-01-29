
var PolarEngine = (function() {
	var objects = {};
	var ctx;
	var width;
	var height;
	var border_radius = 400;
	var origin = [400,400];
	var cleanup = [];
	var object_counter = 0;
	var debug = false;

	var border_id;
	var player_id;
	var player_width = 0.25;
	var timestep_length;
	var buffer;
	var shadow_buffer;
	var true_canvas;
	var misses = 0;
	function getNewObjectID(){
		return object_counter++;
	}

	function PolarObject(r,theta,drawn_radius,drawHandler,collisionHandler,shadowHandler,destructionHandler,physicsUpdater,elastic_interaction,interacting,effectHandler){
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
		this.drawHandler = drawHandler;
		this.handleCollision = collisionHandler;
		this.shadowHandler = shadowHandler;
		this.destructionHandler = destructionHandler;
		this.physicsUpdater = physicsUpdater ? physicsUpdater : function(){this.acc = [0,0];};
		this.effectHandler = effectHandler ? effectHandler : function(){return;};
		this.elastic = !!elastic_interaction;
		this.mass = 1;
		this.interacting = !!interacting;
	}

	PolarObject.prototype.destroy = function (){
		if(objects[this.id]){
			delete objects[this.id];
		}
		if(this.destructionHandler){
			this.destructionHandler();
		}
	}

	function init(canvas) {
		canvas.width = 800;
		canvas.height = 800;
		true_canvas = canvas;
		width = canvas.width;
		height = canvas.height;
		PolarEngine.border_radius = width/2;
		PolarEngine.origin = [border_radius,border_radius];
		buffer = document.createElement('canvas');
		buffer.width = width;
		buffer.height = height;
		shadow_buffer = document.createElement('canvas');
		shadow_buffer.width = width;
		shadow_buffer.height = height;
		previous_time = new Date().getTime();
	}

	function registerObject(object){
		objects[object.id] = object;
	}

	function removeObject(object){
		delete objects[object.id];
	}

	function drawToCanvas(){
		true_canvas.getContext('2d').drawImage(buffer,0,0);
	}

	function drawBase() {
		var ctx = buffer.getContext('2d');
		ctx.save();
		ctx.fillStyle = '#fff';
		ctx.fillRect(0,0,buffer.width,buffer.height);
		ctx.translate(origin[0],origin[1]);
		for (var key in objects) {
			if (objects.hasOwnProperty(key) && objects[key].drawHandler) {
				objects[key].drawHandler(ctx,objects[key]);
			}
		}
		ctx.restore();
	}

	function drawShadows() {
		var context = shadow_buffer.getContext('2d');
		context.save();
		context.clearRect(0,0,width,height);
		context.fillStyle = 'rgba(0,0,0,1)' //'#000';
		context.fillRect(0,0,800,800);
		context.translate(origin[0],origin[1]);
		context.globalCompositeOperation = 'destination-out';
		for (var key in objects) {
			if (objects.hasOwnProperty(key) && objects[key].shadowHandler) {
				objects[key].shadowHandler(context,objects[key]);
			}
		}
		buffer.getContext('2d').drawImage(shadow_buffer,0,0);
		context.globalCompositeOperation = 'source-over';
		context.clearRect(-400,-400,shadow_buffer.width,shadow_buffer.height);
		context.fillStyle = '#000';
		context.fillRect(-400,-400,800,800);
		context.globalCompositeOperation = 'destination-out';
		context.beginPath();
		context.arc(0,0,400,0,2*Math.PI);
		context.fillStyle = '#000';
		context.fill();
		context.closePath();
		context.restore();
		buffer.getContext('2d').drawImage(shadow_buffer,0,0);
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

	function circleShadowHandler(context,object){
		context.beginPath();
		var x = object.pos[0] * Math.cos(object.pos[1]);
		var y = object.pos[0] * Math.sin(object.pos[1]);
		context.arc(x,y,object.size*15 + 2,0,2*Math.PI);
		var grd = context.createRadialGradient(x,y,object.size,x,y,object.size*15);
		grd.addColorStop(0,'rgba(0,0,0,1)');
		grd.addColorStop(1,'rgba(0,0,0,0)');
		context.fillStyle = grd;
		context.fill();
		context.closePath();
	}


	function borderCollisionHandler(border,collider){
		if(collider.pos[0] < 0){
			collider.pos[0] *= -1;
			collider.vel[0] *= -1;
			collider.pos[1] += Math.PI;
			collider.pos[1] = mod(collider.pos[1],2*Math.PI);
		}
		console.log(getAngularDistance(collider.pos[1], objects[PolarEngine.player_id].pos[1]))
		if(getAngularDistance(collider.pos[1], objects[PolarEngine.player_id].pos[1]) < player_width + 0.01){
			collider.vel[0] *= -1;
			collider.vel[1] = collider.vel[1]*0.5 + objects[PolarEngine.player_id].vel[1] * 0.1;
			collider.pos[0] = border.size - objects[PolarEngine.player_id].size/2 - collider.size - 1;
		}
		else if(Math.abs(collider.pos[0]) + collider.size >= border_radius){
			PolarEngine.misses++;
			collider.destroy();
		}

		// else{
		// 	collider.vel[0] *= -0.9;
		// 	collider.vel[1] *= 0.9;
		// 	collider.pos[0] = border.size - collider.size - 1;
		// }
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

	function mapRToRadians(r){
		return r/50;
	}

	function mapThetaToPixels(theta){
		return theta*50;
	}

	function signum(x) { 
		return x > 0 ? 1 : x < 0 ? -1 : 0;
	}

	function calculateDistance(object,other){
		var other_r = other.pos[0]
		var obj_r = object.pos[0];
		var other_theta = other.pos[1]
		var obj_theta = object.pos[1];
		var distance = Math.sqrt(other_r*other_r + obj_r*obj_r - 2*other_r*obj_r*Math.cos(obj_theta - other_theta));
		return distance;
	}

	function elasticCollision(object,other){
		var obj_mag = Math.sqrt(mapRToRadians(object.vel[0])*mapRToRadians(object.vel[0]) + (object.vel[1]*object.vel[1]));
		var other_mag = Math.sqrt(mapRToRadians(other.vel[0])*mapRToRadians(other.vel[0]) + (other.vel[1]*other.vel[1]));

		var obj_signs = [signum(object.vel[0]),signum(object.vel[1])];
		if(obj_signs[0] == 0){
			obj_signs[0] = -signum(object.pos[0]-other.pos[0]);
		}
		if(obj_signs[1] == 0){
			obj_signs[1] = -signum(mod(object.pos[1]-other.pos[1],2*Math.PI));
		}
		var other_signs = [signum(other.vel[0]),signum(other.vel[1])];
		if(other_signs[0] == 0){
			other_signs[0] = -signum(other.pos[0]-object.pos[0]);
		}
		if(other_signs[1] == 0){
			other_signs[1] = -signum(mod(other.pos[1]-object.pos[1],2*Math.PI));
		}

		//impact tells us how the two dimensions are related in the collision
		var pos_mag = object.size + other.size;
		var impact = Math.abs(Math.asin((object.pos[0]-other.pos[0])/pos_mag));
		if(isNaN(impact)) impact = 1;

		object.vel[0] = impact * mapThetaToPixels((obj_signs[0]*obj_mag*(object.mass - other.mass) + 2 * other_signs[0] * other.mass * other_mag)/(object.mass + other.mass));
		object.vel[1] = (1-impact) * (obj_signs[1] * obj_mag*(object.mass - other.mass) + 2 * other_signs[1] * other.mass * other_mag)/(object.mass + other.mass);
		object.old_vel[0] = object.vel[0];
		object.old_vel[1] = object.vel[1];

		other.vel[0] = impact * mapThetaToPixels((other_signs[0] * other_mag*(other.mass - object.mass) + 2 * obj_signs[0] * object.mass * obj_mag)/(object.mass + other.mass));
		other.vel[1] = (1-impact) * (other_signs[1] * other_mag*(other.mass - object.mass) + 2 * obj_signs[1] * object.mass * obj_mag)/(object.mass + other.mass);
		other.old_vel[0] = other.vel[0];
		other.old_vel[1] = other.vel[1];

		//now move everything so it's nonintersecting
		//go to cartesian for this, doing it with theta is a pain
		var move_delta = [0,0];
		var object_xy = [object.pos[0] * Math.cos(object.pos[1]),object.pos[0] * Math.sin(object.pos[1])];
		var other_xy = [other.pos[0] * Math.cos(other.pos[1]),other.pos[0] * Math.sin(other.pos[1])];

		move_delta[0] = object_xy[0] - other_xy[0];
		move_delta[1] = object_xy[1] - other_xy[1];

		var mag = Math.sqrt(move_delta[0]*move_delta[0] + move_delta[1]*move_delta[1]);
		move_delta[0] /= mag;
		move_delta[1] /= mag;

		var desired_distance = object.size + other.size;
		var current_distance = calculateDistance(object,other);
		move_delta[0] *= desired_distance-current_distance;
		move_delta[1] *= desired_distance-current_distance;

		object_xy[0] += move_delta[0]/2;
		object_xy[1] += move_delta[1]/2;

		other_xy[0] -= move_delta[0]/2;
		other_xy[1] -= move_delta[1]/2;

		//now back to polar
		object.pos[0] = Math.sqrt(object_xy[0] * object_xy[0] + object_xy[1]*object_xy[1]);
		object.pos[1] = Math.atan2(object_xy[1],object_xy[0]);

		other.pos[0] = Math.sqrt(other_xy[0] * other_xy[0] + other_xy[1]*other_xy[1]);
		other.pos[1] = Math.atan2(other_xy[1],other_xy[0]);
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
		var seen = {};
		for(var key in objects){
			if(objects.hasOwnProperty(key)){
				seen[key] = 1;
				if(objects[key].interacting){
					var current = objects[key];
					for(var other in objects){
						if(!seen[other] && objects.hasOwnProperty(other) && objects[other].interacting){
							var other_obj = objects[other];
							var distance = calculateDistance(current,other_obj);
							if(distance < Math.abs(objects[other].size + current.size)){
								//apply elastic collisions
								if(current.elastic && other_obj.elastic){
									elasticCollision(current,other_obj);
								}
								current.handleCollision(current,other_obj);
								other_obj.handleCollision(other_obj,current);
							}
						}
					}
				}
			}
		}

		//check for game border collisions and apply physics functions
		for(var key in objects){
			if(objects.hasOwnProperty(key)){
				if(key != PolarEngine.border_id && key != PolarEngine.player_id){
					if(Math.abs(objects[key].pos[0]) + objects[key].size > PolarEngine.border_radius - objects[PolarEngine.player_id].size/2){
						objects[PolarEngine.border_id].handleCollision(objects[PolarEngine.border_id],objects[key]);
					}
				}
				objects[key].physicsUpdater(delta);
				objects[key].effectHandler(delta);
			}
		}
	}


	function updateWorld(){
		var current = new Date().getTime();
		var delta = current - previous_time; 
		previous_time = current;
		timestep(delta);
		drawBase();
		drawShadows();
		drawToCanvas();
	}

	return {
		init : init,
		update : updateWorld,
		PolarObject : PolarObject,
		register : registerObject,
		remove : removeObject,
		circleHandler : circleHandler,
		circleShadowHandler : circleShadowHandler,
		borderCollisionHandler : borderCollisionHandler,
		player_id : player_id,
		border_id : border_id,
		border_radius : border_radius,
		player_width : player_width,
		timestep_length : timestep_length,
		getAngularDistance : getAngularDistance,
		mod : mod,
		misses :misses
	}
})();
