const EventEmitter2 = require("eventemitter2").EventEmitter2;
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
        
        this.id = 1;
        this.x = 50;
		this.y = 50;
		this.width = 2.25;
		this.height = 2.625;
		this.angle = 0;
		this.speed = 1;
		this.base_speed = 0.25;
		this.health = 500;
		this.hitbox_r = 1.35;
		this.color = {"h": 100, "s": 65, "l": 50};
		this.max_bullets = 80; //10 waves * 8 bullets each
        this.bullets = 0;
        this.loop_tick = 0;

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

        shoot()
        {
            var self;
            if (this.health <= 0 || this.bullets >= this.max_bullets) return false;
            
            var bullet_id = crypto.createHash("md5").update(this.id+Math.round(Math.random()*89999+10000)).digest("hex");
            
            var bullet = new Bullet(bullet_id, this.x, this.y, this.angle);
            bullet.move(this.height/2);
            bullet.setColor(this.color);
            bullet.setOwner(this);
            bullet.setSpeed(0.5 * this.getEffect("bullet_speed"));
            
            this.bullets ++;
            this.emit("updateBulletCount", this.bullets);
            bullet.on("despawn", function()
            {
                bullet.shooter.bullets --;
                bullet.shooter.emit("updateBulletCount", bullet.shooter.bullets);
            });
            
            this.emit("bulletFired", bullet);
        }

        registerHit(bullet)
        {
            bullet.despawn();
            this.health -= Math.max(bullet.damage-(this.getEffect("bonus_health") > 1 ? this.getEffect("bonus_health") : 0), 0);
            
            if (this.health <= 0)
            {
                this.emit("death", bullet.shooter);
            }
            else
            {
                this.emit("hit", bullet.shooter);
            }
        }
        
        update()
        {
            if (this.health <= 0) return false;
                if (this.loop_tick <= 480) //8sec = 60fps * 16 = 960
                {
                    this.loop_tick++;
                    if (this.loop_tick % 90 == 0) //every 1,5sec
                    {
                        //SHOOT
                        this.speed = 0;
                        self.shoot();
                        
                    }
                    this.x += Math.cos(toRadians(this.angle)) * this.speed * this.base_speed * this.getEffect("movement_speed");
                    this.y += Math.sin(toRadians(this.angle)) * this.speed * this.base_speed * this.getEffect("movement_speed");
                    this.speed = 1;
                }
                else
                {
                this.loop_tick = 0;
                this.x += Math.cos(toRadians(this.angle)) * this.speed * this.base_speed * this.getEffect("movement_speed");
                this.y += Math.sin(toRadians(this.angle)) * this.speed * this.base_speed * this.getEffect("movement_speed");
                this.speed = 1;
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
                width: this.width,
                height: this.height
            };
        }

}

module.exports = Bot;



