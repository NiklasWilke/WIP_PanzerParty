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
		this.angle = angle;
		this.speed = 1.5;
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
	}
	
	// move with [speed] in [angle] direction
	update()
	{
		if (this.y < 0)
		{
			console.log("B#"+this.id+" bounce TOP "+this.angle+"°");
			this.angle *= -1;
			
			this.bounces++;
		}
		
		if (this.y > 100)
		{
			console.log("B#"+this.id+" bounce BOTTOM "+this.angle+"°");
			this.angle *= -1;
			
			this.bounces++;
		}
		
		
		if (this.x < 0)
		{
			console.log("B#"+this.id+" bounce LEFT "+this.angle+"°");
			this.angle = 180 - this.angle;
			
			this.bounces++;
		}
		
		if (this.x > 100)
		{
			console.log("B#"+this.id+" bounce RIGHT "+this.angle+"°");
			this.angle = this.angle > 0 ? 180 - this.angle : -180 - this.angle;
			
			this.bounces++;
		}
		
		//if (this.x < 0 && this.angle < 90 && this.angle > 0) this.angle = 360 - this.angle; 
		//if (this.x < 0 && this.angle < 180 && this.angle > 90) this.angle = 180 + this.angle; 
		
		
		this.x += Math.cos(toRadians(this.angle)) * this.speed * 0.3;
		this.y += Math.sin(toRadians(this.angle)) * this.speed * 0.3;
	}
}

module.exports = Bullet;