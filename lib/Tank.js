const EventEmitter2 = require("eventemitter2").EventEmitter2;
const Bullet = require("./Bullet.js");
const crypto = require("crypto");

function toDegrees(angle)
{
	return angle * (180 / Math.PI);
}
function toRadians(angle)
{
	return angle * (Math.PI / 180);
}

class Tank extends EventEmitter2
{
	constructor(id, name, socket)
	{
		super();
		
		var self = this;
		
		this.id = id;
		this.name = name;
		this.x = 50;
		this.y = 50;
		this.width = 2.25; //3;
		this.height = 2.625; //3.5;
		this.angle = 0;
		this.speed = 0;
		this.base_speed = 0.25;
		this.health = 100;
		this.hitbox_r = 1.35; //1.8;
		this.color = {
			h: Math.round(Math.random() * 360),
			s: Math.round(Math.random() * 40 + 30),
			l: Math.round(Math.random() * 40 + 40)
		};
		
		this.socket = socket;
		
		
		// disconnect
		this.socket.on("disconnect", function()
		{
			self.health = 0;
			self.setSpeed(0);
		});
		
		
		// player joystick input
		this.socket.on("move", function(a, s)
		{
			if (a != null && s != null && self.health > 0)
			{
				self.setAngle(a);
				self.setSpeed(s);
			}
			else
			{
				self.setSpeed(0);
			}
		});
		
		// player fire-button input
		this.socket.on("shoot", function()
		{
			console.log("shoot ", this.id);
			self.shoot();
		});
		
		// player death
		this.on("death", function()
		{
			self.setSpeed(0);
			//this.socket.emit("death", "Dein Panzer wurde zerstört!");
		});
	}
	
	setAngle(a)
	{
		this.angle = a;
	}
	
	setSpeed(s)
	{
		this.speed = s;
	}
	
	distanceTo(obj)
	{
		return Math.sqrt(Math.pow(this.x - obj.x, 2) + Math.pow(this.y - obj.y, 2));
	}
	
	// move with [speed] in [angle] direction
	update()
	{
		if (this.health <= 0) return false;
		
		this.x += Math.cos(toRadians(this.angle)) * this.speed * this.base_speed;
		this.y += Math.sin(toRadians(this.angle)) * this.speed * this.base_speed;
	}
	
	// shoot a bullet in [angle] direction
	shoot()
	{
		if (this.health <= 0) return false;
		
		var bullet_id = crypto.createHash("md5").update(this.id+Math.round(Math.random()*89999+10000)).digest("hex");
		
		var bullet = new Bullet(bullet_id, this.x + Math.cos(toRadians(this.angle)) * this.height/2, this.y + Math.sin(toRadians(this.angle)) * this.height/2, this.angle);
		bullet.setColor(this.color);
		bullet.setOwner(this);
		
		this.emit("bulletFired", bullet);
	}
	
	registerHit(bullet)
	{
		this.health -= 60;
		
		if (this.health <= 0)
		{
			this.emit("death", bullet.shooter);
		}
		else
		{
			this.emit("hit", bullet.shooter);
		}
	}
	
	toObject()
	{
		return {
			id: this.id,
			name: this.name,
			color: this.color
		};
	}
}

module.exports = Tank;