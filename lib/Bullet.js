const EventEmitter2 = require("eventemitter2").EventEmitter2;
const crypto = require("crypto");

function toDegrees(angle)
{
	return angle * (180 / Math.PI);
}

function toRadians(angle)
{
	return angle * (Math.PI / 180);
}

class Bullet extends EventEmitter2
{
	constructor(id, x, y, angle)
	{
		super();
		
		this.id = id;
		this.x_start = x;
		this.y_start = y;
		this.x = x;
		this.y = y;
		this.setAngle(angle);
		this.speed = 0.5;
		this.bounces = 0;
		this.max_bounces = 3;
		this.color = {};
		this.type = "default";
		this.collision = true;
	}
	
	setColor(color)
	{
		this.color = color;
	}
	
	setAngle(a)
	{
		this.angle = a;
		this.vector = [
			Math.cos(toRadians(this.angle)),
			Math.sin(toRadians(this.angle))
		];
		this.s = this.vector[1] / this.vector[0];
		this.b = this.y - this.x * this.s;
	}
	
	setSpeed(s)
	{
		this.speed = s;
	}
	
	setMaxBounces(mb)
	{
		this.max_bounces = mb;
	}
	
	setType(type)
	{
		this.type = type;
	}
	
	setCollision(collision)
	{
		this.collision = collision;
	}
	
	setOwner(tank)
	{
		this.shooter = tank;
	}
	
	distanceTo(obj)
	{
		return this.distanceTo(obj.x, obj.y);
	}
	
	distanceTo(x, y)
	{
		return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
	}
	
	// move with [speed] in [angle] direction
	bounce(dir)
	{
		//console.log("B:"+this.id+" bounces "+dir);
		switch (dir)
		{
			case "UP":
			case "DOWN":
			case 90:
			case -90:
			case 270:
			case -270:
				this.setAngle(this.angle * -1);
				break;
			
			case "RIGHT":
			case 0:
			case 360:
				this.setAngle(180 - this.angle);
				break;
			
			case "LEFT":
			case 180:
			case -180:
				this.setAngle(this.angle > 0 ? 180 - this.angle : -180 - this.angle);
				break;
			
			default:
				console.log("Invalid bounce direction!");
				break;
		}
		
		this.bounces++;
		
		if (this.bounces > this.max_bounces) this.emit("despawn");
		else this.emit("bounced");
	}
	
	// move by [distance] direction
	move(distance)
	{
		this.x += this.vector[0] * distance;
		this.y += this.vector[1] * distance;
	}
	
	// move with [speed]
	update()
	{
		this.move(1 * this.speed);
	}
	
	// despawn
	despawn()
	{
		this.emit("despawn");
	}
	
	clone()
	{
		var b = new Bullet(this.id, this.x, this.y, this.angle);
		b.speed = this.speed;
		b.bounces = this.bounces;
		b.max_bounces = this.max_bounces;
		b.color = this.color;
		return b;
	}
}

module.exports = Bullet;