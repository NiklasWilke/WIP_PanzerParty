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
		this.x = x;
		this.y = y;
		this.setAngle(angle);
		this.speed = 0.5;
		this.bounces = 0;
		this.max_bounces = 3;
		this.color = {};
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
	}
	
	setSpeed(s)
	{
		this.speed = s;
	}
	
	setOwner(tank)
	{
		this.shooter = tank;
	}
	
	distanceTo(obj)
	{
		return Math.sqrt(Math.pow(this.x - obj.x, 2) + Math.pow(this.y - obj.y, 2));
	}
	
	// move with [speed] in [angle] direction
	bounce(dir)
	{
		console.log("B:"+this.id+" bounces "+dir);
		switch (dir)
		{
			case "UP":
			case "DOWN":
				this.angle *= -1;
				break;
			
			case "RIGHT":
				this.angle = 180 - this.angle;
				break;
			
			case "LEFT":
				this.angle = this.angle > 0 ? 180 - this.angle : -180 - this.angle;
				break;
		}
		
		this.bounces++;
		
		this.emit("bounced");
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