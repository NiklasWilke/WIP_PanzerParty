const crypto = require("crypto");

const Point = require("./Point.js");
const Map = require("./Map.js");
const Powerup = require("./Powerup.js");
const Bullet = require("./Bullet.js");
const Tank = require("./Tank.js");

function toDegrees(angle)
{
	return angle * (180 / Math.PI);
}
function toRadians(angle)
{
	return angle * (Math.PI / 180);
}

class GameEngine
{
	constructor(io)
	{
		var self = this;
		
		this.io = io;
		this.sockets = io.sockets;
		
		this.id = crypto.createHash("md5").update(Math.round(Math.random()*89999+10000)+"").digest("hex");
		this.player = [];
		this.tanks = [];
		this.bullets = [];
		
		this.level = new Map(require("../maps/level_5.json"));
		// this.level.on("powerupSpawned", function(powerup)
		// {
			// self.sockets.emit("spawnPowerup", powerup);
		// });
		// this.level.on("powerupPickedUp", function(powerup)
		// {
			// self.sockets.emit("updatePowerups", powerup);
		// });
		
		this.powerup_cooldown_max = 12;		
		this.powerup_cooldown_min = 6;
		this.powerup_cooldown = this.powerup_cooldown_min;
		
		this.io.on("connection", function(socket)
		{
			var id = crypto.createHash("md5").update(socket.handshake.address).digest("hex");
			
			console.log("socket connected > ", id);
			
			socket.emit("renderMap", {
				tiles: self.level.tiles,
				powerups: self.level.powerups
			});
			
			// player login with name, color (tbd) etc.
			socket.on("register", function(name, callback)
			{
				var tank = new Tank(id, name, socket);
				
				// playce on map
				while (self.level.checkCollision(tank) != null)
				{
					tank.x = Math.random()*100;
					tank.y = Math.random()*100;
				}
				
				tank.on("bulletFired", function(bullet)
				{
					console.log(tank.id+" fired B#"+bullet.id);
					self.bullets.push(bullet);
					io.sockets.emit("shotFired");
				});
				tank.on("death", function(killer)
				{
					io.sockets.emit("kill", killer, tank);
					if (killer.id == tank.id)
					{
						socket.emit("death", "Du hast dich selber zerstört! lol");
					}
					else
					{
						socket.emit("death", killer.name+" hat dich zerstört!");
					}
					//self.sockets.emit("message", "");
				});
				tank.on("hit", function()
				{
					socket.emit("hit", tank.health);
				});
				self.tanks.push(tank);
				
				callback(tank.toObject());
			});
		});
		
		this.updateLoop();
	}
	
	
	checkCollision(a, b)
	{
		// Bullet/Tank collision
		if ((a instanceof Bullet && b instanceof Tank) || (b instanceof Bullet && a instanceof Tank))
		{
			var tank = a instanceof Tank ? a : b;
			var bullet = a instanceof Bullet ? a : b;
			
			if (tank.health <= 0) return false;
			
			var angle = tank.angle;
			var cx = tank.x;
			var cy = tank.y;
			var x = bullet.x;
			var y = bullet.y;
			var cos = Math.cos(toRadians(angle));
			var sin = Math.sin(toRadians(angle));
			
			var dx = (cos * (x - cx)) + (sin * (y - cy));
			var dy = (cos * (y - cy)) - (sin * (x - cx));
			
			//console.log("check colision > T["+tank.x+", "+tank.y+"] > B["+bullet.x+", "+bullet.y+"] >> ["+temp.x+", "+temp.y+"] d:"+dist+" | "+Math.sqrt(Math.pow(temp.x-tank.x, 2) + Math.pow(temp.y-tank.y, 2)));
			
			return (Math.abs(dx) <= tank.height / 2) && (Math.abs(dy) <= tank.width / 2);
		}
	}
	
	updateLoop()
	{
		// update tank positions
		for (var t in this.tanks)
		{
			var tank = this.tanks[t];
			var x = tank.x,
				y = tank.y;
			
			if (tank.health <= 0) continue;
			tank.update();
			
			var tiles = this.level.checkCollision(tank);
			if (tiles)
			{
				//console.log("T:"+tank.id+" collided with ", tiles);
				console.log("COLLISION ", tiles.map(function(t){return [t.x, t.y]}));
				
				tank.x = x;
				tank.y = y;
			}
		}
		
		
		// update bullet positions
		for (var b in this.bullets)
		{
			var bullet = this.bullets[b];
			bullet.update();
			
			var tile = this.level.checkCollision(bullet);
			if (tile != null && tile.type == 1)
			{
				var offset_x = bullet.x - (tile.x_abs + tile.size/2);
				var offset_y = bullet.y - (tile.y_abs + tile.size/2);
				
				var dir = (Math.abs(offset_x) > Math.abs(offset_y)) ? (offset_x > 0 ? "RIGHT" : "LEFT") : (offset_y > 0 ? "DOWN" : "UP");
				
				bullet.bounce(dir);
			}
			
			
			var despawn = (bullet.bounces > bullet.max_bounces);
			
			// check for hits
			for (var t in this.tanks)
			{
				var tank = this.tanks[t];
				if (this.checkCollision(tank, bullet))
				{
					console.log("T:"+tank.id+" hit by B:"+bullet.id);
					despawn = true;
					tank.registerHit(bullet);
					break;
				}
			}
			
			if (despawn) this.bullets.splice(b, 1);
		}
		
		
		// update powerups
		this.powerup_cooldown--;
		if (this.powerup_cooldown <= 0)
		{
			this.level.spawnPowerup();
			this.powerup_cooldown = Math.round(Math.random() * (this.powerup_cooldown_max*60-this.powerup_cooldown_min*60) + this.powerup_cooldown_min*60);
		}
		
		loop:
		for (var p in this.level.powerups)
		{
			var powerup = this.level.powerups[p];
			
			for (var t in this.tanks)
			{
				var tank = this.tanks[t];
				if (powerup.distanceTo(tank) < tank.hitbox_r + powerup.size/2)
				{
					console.log("> T:"+tank.id+" pick up P:"+powerup.id);
					this.level.despawnPowerup(powerup.id);
					continue loop;
				}
			}
		}
		
		
		
		
		this.sockets.emit("update", {bullets: this.bullets, tanks: this.tanks.map(function(t){t.socket=null;return t;}), powerups: this.level.powerups});
		
		var self = this;
		setTimeout(function()
		{
			self.updateLoop();
		}, 1000/60);
	};
}

module.exports = GameEngine;