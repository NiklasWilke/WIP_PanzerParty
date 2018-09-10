const EventEmitter2 = require("eventemitter2").EventEmitter2;
const Color = require("./Color.js");
const Bullet = require("./Bullet.js");
const crypto = require("crypto");

//if true, developer logs are activated
const DEV = false;


//zx284 
function toRadians(angle)
{
	return angle * (Math.PI / 180);
}

class Bot extends EventEmitter2
{
	//zx284
	constructor(id, color)
	{
		//zx284
		super();
		//zx284
		var self = this;

		//zx284
		this.id = crypto.createHash("md5").update(Math.round(Math.random()*89999+10000)+"").digest("hex");
		this.x = 50;
		this.y = 50;
		//hitbox & size
		this.radius = 1.3;
		//face direction
		this.angle = 0;
		//rotation for rotate movement
		this.rotation = 0;
		//movement speed
		this.speed = 1;
		//base speed to multiply with acceleration
		this.base_speed = 0.6;
		this.max_speed = 5;
		//this.current_health = this.max_health;
		this.health = 500;
		//this.max_health = 500;
		//hitbox radius for collision bubble
		this.hitbox_r = 1;
		//basecolor which gets overwritten by color selection
		this.color = new Color(0, 70, 60);
		//fake player name
		this.player = {name: "Party Crasher"};

		
		//rotation value per tick => 100 degrees per sec
		this.rotation_speed = 100 / 60; //
		this.move_duration = 3 * 60; // 3 secs
		//removed: this.bullets = 0;
		//shoots every x seconds
		//rename: this.shoot_cooldown
		this.cooldown = 3 * 60; // 3 secs
		//delay between the waves
		this.wave_delay = 0.4 * 60; // 1 sec
		////zx284
		this.shoot_delay = 0.1 * 60; // 1 sec
		//amount of waves fired
		this.wave_amount = 3;
		//angle of rotation between each wave to the next
		//zx284 * 2?
		this.wave_rotation = 360 / (8*3) * 2; // 30

		//zx284
		this.loop_tick = 0;
		//zx284
		this.shoot_ticks = 0;
		//zx284
		this.last_shot = null;

		//theoretical sequence of behaviour
		//removed: this.behaviour = [];

		//zx284 where does the emit come from ? GameEngine.js ?
		this.on("death", function(killer)
		{
			//console.log("B:"+self.id+" killed by ", killer);
			//zx284 why the killer.emit ?
			if (killer && killer.id != self.id) killer.emit("kill", self);
		});
	}

	//interact from outside - set/get functions
	setAngle(a)
	{
		this.angle = a;
	}

	setSpeed(s)
	{
		this.speed = s;
	}

	//calculates the distance from bot to parsed object
	distanceTo(obj)
	{	
		//Hypothenuse a² + b² = c²
		return Math.sqrt(Math.pow(this.x - obj.x, 2) + Math.pow(this.y - obj.y, 2));
	}


	//circle shot
	shoot()
	{
		if (this.health <= 0) return false;

		//n = amount of bullets fired per wave
		var n = 8;
		for (var i=0; i<n; i++)
		{
			//zx284 why hash the bullet |  update the bullet ids by hased value before the creation of the next bullet
			var bullet_id = crypto.createHash("md5").update(this.id+Math.round(Math.random()*89999+10000)).digest("hex");
			var bullet = new Bullet(bullet_id, this.x, this.y, this.rotation + i * (360 / n));
			////zx284 why not set it in the constructor ?
			bullet.setMaxBounces(0);
			bullet.setColor(this.color);
			//this = tank in this case
			bullet.setOwner(this);
			bullet.setSpeed(0.7);
			////zx284 given parameter determines spawn point => radius + safety value
			bullet.move(this.radius * 1.2);   // +20% to avoid self collision


			//logs the moment of the last shot			
			this.last_shot = Date.now();
			////zx284 BOT emits bulletFired event to ? GameEngine ? FrontEnd ? GameManager ?
			this.emit("bulletFired", bullet);
		}
	}

	//gets called when hit by a bullet ?
	registerHit(bullet)
	{
		//bullet gets despawned
		bullet.despawn();
		this.health -= bullet.damage;
		
		//checks hp and alive stat only when hit by a bullet
		if (this.health <= 0)
		{	
			
			this.emit("death", bullet.shooter);
		}
		else
		{
			this.emit("hit", bullet.shooter);
			if (DEV) console.log("Tank HP:" + this.health + "\nTank Angle:" + this.angle + "\nTank rotation:" + this.rotation + "\nLoop tick:" + this.loop_tick + "\nShoot tick:" + this.shoot_ticks);
		}
	}


	//perma loop gets executed every tick
	update()
	{
		if (this.health <= 0) return false;

		this.loop_tick++;

		if (this.loop_tick <= this.move_duration)
		{
			//zx284 Math.cos(toRadians) ??
			//update position x & y each tick
			this.x += Math.cos(toRadians(this.angle)) * Math.min((this.speed * this.base_speed), this.max_speed);
			this.y += Math.sin(toRadians(this.angle)) * Math.min((this.speed * this.base_speed), this.max_speed);
		}
		else if (this.loop_tick <= this.move_duration + this.wave_amount * (this.wave_delay + this.shoot_delay + Math.round(this.wave_rotation / this.rotation_speed)))
		{
			var tick = Math.round(this.loop_tick - this.move_duration);
			var wave = Math.floor(tick / (this.wave_delay + this.shoot_delay + Math.round(this.wave_rotation / this.rotation_speed)));
			tick = tick % (this.wave_delay + this.shoot_delay + Math.round(this.wave_rotation / this.rotation_speed));

			if (tick == 0)
			{
				// shoot
				this.shoot();
			}
			if (tick < this.wave_delay)
			{
				// pause
				if (DEV) console.log("W"+wave+",T:"+("000"+tick).slice(-2)+" > pause 1");
			}
			else if (tick < this.wave_delay + Math.round(this.wave_rotation / this.rotation_speed))
			{
				if (DEV) console.log("W"+wave+",T:"+("000"+tick).slice(-2)+" > rotate by "+this.rotation_speed);
				this.rotation = (this.rotation + this.rotation_speed) % 360;
			}
			else if (tick < this.wave_delay + Math.round(this.wave_rotation / this.rotation_speed) + this.shoot_delay)
			{
				// pause
				if (DEV) console.log("W"+wave+",T:"+("000"+tick).slice(-2)+" > pause 2");
			}
		}
		else
		{
			if (DEV) console.log("#### RESET ####");
			this.loop_tick = 0;
		}
	}

	toObject()
	{
		return {
			id: this.id,
			name: this.name,
			color: this.color,
			x: this.x,
			y: this.y,
			angle: this.angle,
			rotation: this.rotation,
			radius: this.radius
		};
	}
}

module.exports = Bot;
