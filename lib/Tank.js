const EventEmitter2 = require("eventemitter2").EventEmitter2;
const Player = require("./Player.js");
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
	constructor(player)
	{
		super();
		
		var self = this;
		
		this.id = player.id;
		this.player = {id: player.id, name: player.name, color: player.color};
		
		this.x = 50;
		this.y = 50;
		this.width = 2.25;
		this.height = 2.625;
		this.angle = 0;
		this.speed = 0;
		this.base_speed = 0.25;
		this.health = 100;
		this.hitbox_r = 1.35;
		this.color = player.color;
		
		this.effects = [];
		
		
		// disconnect
		player.on("disconnect", function()
		{
			self.health = 0;
			self.setSpeed(0);
		});
		
		
		// player death
		this.on("death", function()
		{
			self.setSpeed(0);
		});
		
		console.log("ok");
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
		
		this.x += Math.cos(toRadians(this.angle)) * this.speed * this.base_speed * this.getEffect("movement_speed");
		this.y += Math.sin(toRadians(this.angle)) * this.speed * this.base_speed * this.getEffect("movement_speed");
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
	
	pickUpPowerup(powerup)
	{
		this.emit("activatePowerup", powerup);
	}
	
	addEffect(effect, duration)
	{
		var self = this;
		var id = crypto.createHash("md5").update(Math.round(Math.random()*89999+10000)+"").digest("hex");
		effect.id = id;
		this.effects.push(effect);
		
		console.log("T:"+this.id+" > add effect");
		
		setTimeout(function()
		{
			for (var e in self.effects)
			{
				if (self.effects[e].id == id) self.effects.splice(e, 1);
			}
			console.log("T:"+self.id+" > effect disabled");
		}, duration);
	}
	
	getEffect(name)
	{
		var val = 1;
		for (var e in this.effects)
		{
			if (this.effects[e][name]) val *= this.effects[e][name];
		}
		return val;
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