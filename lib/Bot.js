const EventEmitter2 = require("eventemitter2").EventEmitter2;
const Color = require("./Color.js");
const Bullet = require("./Bullet.js");
const crypto = require("crypto");

function toRadians(angle)
{
	return angle * (Math.PI / 180);
}

class Bot extends EventEmitter2
{
    constructor(id, color)
    {    
        super();
        var self = this;
        
        this.id = crypto.createHash("md5").update(Math.round(Math.random()*89999+10000)+"").digest("hex");
        this.x = 50;
		this.y = 50;
		this.radius = 1.3;
        this.angle = 0;
        this.rotation = 0;
		this.speed = 1;
		this.base_speed = 0.5;
		this.health = 500;
		this.hitbox_r = 1;
        this.color = new Color(0, 70, 60);
		this.player = {name: "Party Crasher"};
        
		this.max_bullets = 80; //10 waves * 8 bullets each
        this.bullets = 0;
        //shoots every x seconds
        this.cooldown = 3;
        //delay between the waves
        this.wave_delay = 26; //16
        //amount of waves fired
        this.wave_amount = 3;
        this.wave_rotation = 360 / (8*3) * 2 //this.waves_amount;

        this.loop_tick = 0;
        this.shoot_ticks = 0;

        this.behaviour = [];
        
        this.on("death", function(killer)
		{
			self.setSpeed(0);
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


        //circle shoot
        shoot()
        {
            var self;
            if (this.health <= 0) return false;
            
			var n = 8;
			for (var i=0; i<n; i++)
			{
				var bullet_id = crypto.createHash("md5").update(this.id+Math.round(Math.random()*89999+10000)).digest("hex");
				var bullet = new Bullet(bullet_id, this.x, this.y, this.angle + this.rotation + i * (360 / n));
				bullet.move(this.radius * 1.01);   // avoid self collision
				bullet.setMaxBounces(0);
				bullet.setColor(this.color);
				bullet.setOwner(this);
				bullet.setSpeed(0.7);
				
				bullet.on("despawn", function()
				{
					bullet.shooter.bullets --;
				});
				
				this.bullets ++;
				this.emit("bulletFired", bullet);
			}
        }

        registerHit(bullet)
        {
            bullet.despawn();
            this.health -= bullet.damage;
            
            if (this.health <= 0)
            {
                this.emit("death", bullet.shooter);
            }
            else
            {
                this.emit("hit", bullet.shooter);
                console.log("Tank HP:" + this.health + "\nTank Angle:" + this.angle + "\nTank rotation:" + this.rotation + "\nLoop tick:" + this.loop_tick + "\nShoot tick:" + this.shoot_ticks);
            }
        }
        
		update()
		{
            if (this.health <= 0) return false;
            
			this.loop_tick++;
			
			if (this.loop_tick == 60 * this.cooldown + this.wave_amount * this.wave_delay) // every 3 sec
			{
				console.log("[BOT]<"+this.loop_tick+"> beginning new cycle");
				
				this.loop_tick = 0;
				this.shoot_ticks = 0;
			}
			else if (this.shoot_ticks < this.wave_amount * this.wave_delay)
			{
				this.shoot_ticks++;
				
				if (this.shoot_ticks % this.wave_delay - 10 == 0)
				{
                    this.rotation = (this.rotation + this.wave_rotation) % 360;
                    this.emit("botRotate");
				}
				else if (this.shoot_ticks % this.wave_delay == 0)
				{
					this.shoot();
				}
			}
			else
			{
				this.x += Math.cos(toRadians(this.angle)) * this.speed * this.base_speed;
				this.y += Math.sin(toRadians(this.angle)) * this.speed * this.base_speed;
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



