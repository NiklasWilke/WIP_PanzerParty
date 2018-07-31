const EventEmitter2 = require("eventemitter2").EventEmitter2;
const crypto = require("crypto");
const fs = require("fs");

const Point = require("./Point.js");
const Player = require("./Player.js");
const Level = require("./Level.js");
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

class GameEngine extends EventEmitter2
{
	constructor(io)
	{
		console.log("ini GameEngine");
		super();
		
		var self = this;
		
		this.FPS = 60;
		
		this.io = io;
		this.sockets = io.sockets;
		
		this.id = crypto.createHash("md5").update(Math.round(Math.random()*89999+10000)+"").digest("hex");
		this.tanks = [];
		this.graveyard = [];
		this.bullets = [];
		this.map = null;
		
		this.state = "not_started";
		
		this.powerup_cooldown_max = 12;		
		this.powerup_cooldown_min = 6;
		this.powerup_cooldown = this.powerup_cooldown_min;
		
		this.io.on("connection", function(socket)
		{
			
		});
	}
	
	start()
	{
		console.log("> starting game");
		this.state = "running";
		this.emit("changedState", this.state);
		this.updateLoop();
	}
	
	stop()
	{
		console.log("> stopping game");
		this.state = "stopped";
		this.emit("changedState", this.state);
	}
	
	setLevel(level)
	{
		this.map = level ? new Map(level) : null;
	}
	
	spawnTank(player)
	{
		var self = this;
		
		var tank = new Tank(player);
		tank.x = Math.random()*100;
		tank.y = Math.random()*100;
		
		// place on map
		while (self.map.checkCollision(tank) != null)
		{
			tank.x = Math.random()*100;
			tank.y = Math.random()*100;
		}
		
		tank.on("bulletFired", function(bullet)
		{
			console.log("T:"+tank.id+" fired B:"+bullet.id);
			
			bullet.on("despawn", function()
			{
				self.io.sockets.emit("bulletDespawned", bullet);
				
				// despawn bullet
				for (var b in self.bullets)
				{
					if (self.bullets[b].id == bullet.id)
					{
						self.bullets.splice(b, 1);
						break;
					}
				}
			});
			
			bullet.on("bounced", function()
			{
				self.io.sockets.emit("bulletBounced", bullet);
			});
			
			self.bullets.push(bullet);
			self.io.sockets.emit("shotFired");
		});
		tank.on("despawn", function()
		{
			// despawn tank
			for (var t in self.tanks)
			{
				if (self.tanks[t].id == tank.id)
				{
					self.graveyard.push(tank.toObject());
					self.tanks.splice(t, 1);
					break;
				}
			}
		});
		tank.on("death", function(killer)
		{
			player.deaths++;
			self.io.sockets.emit("kill", (killer ? killer : null), tank);
			player.tank = null;
			
			player.socket.emit("death", (!killer || killer.id == tank.id) ? null : killer);
			
			self.emit("updateScoreboard");
			
			// despawn tank
			for (var t in self.tanks)
			{
				if (self.tanks[t].id == tank.id)
				{
					self.graveyard.push(tank.toObject());
					self.tanks.splice(t, 1);
					break;
				}
			}
		});
		tank.on("kill", function(victim)
		{
			player.kills++;
		});
		tank.on("hit", function()
		{
			player.socket.emit("hit", tank.health);
		});
		tank.on("activatePowerup", function(powerup)
		{
			console.log("> T:"+tank.id+" activated ", powerup.name);
			self.io.sockets.emit("powerupActivated", tank, powerup);
			for (var t in self.tanks)
			{
				self.tanks[t].addEffect((self.tanks[t].id==tank.id ? powerup.effect.self : powerup.effect.other), powerup.duration);
			}
		});
		
		player.tank = tank;
		self.tanks.push(tank);
		
		console.log("spawned "+tank.id+" ["+tank.x+", "+tank.y+"]");
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
	
	bullet_helper(bullet, distance)
	{
		if (distance <= 0) return bullet;
		
		var tile = this.map.getTileAtPos(bullet.x, bullet.y);
		
		var s = bullet.s;
		var b = bullet.b;
		
		
		var fixFloat = function(f)
		{
			if (!isFinite(f)) return 1000000;
			return f;
		}
		
		// Y = s * X + b);
		
		var left = fixFloat((tile.x_abs - bullet.x));
		var top = fixFloat((tile.y_abs - bullet.y));
		var right = fixFloat((tile.x_abs + tile.size - bullet.x));
		var bottom = fixFloat((tile.y_abs + tile.size - bullet.y));
		
		if (left == 0) left += tile.size * (bullet.vector[0] / Math.abs(bullet.vector[0]));
		if (right == 0) right += tile.size * (bullet.vector[0] / Math.abs(bullet.vector[0]));
		if (top == 0) top += tile.size * (bullet.vector[1] / Math.abs(bullet.vector[1]));
		if (bottom == 0) bottom += tile.size * (bullet.vector[1] / Math.abs(bullet.vector[1]));
		
		var rel_left = left / bullet.vector[0];
		var rel_top = top / bullet.vector[1];
		var rel_right = right / bullet.vector[0];
		var rel_bottom = bottom / bullet.vector[1];
		
		// abstände relative zum bewegungsverktor
		var x = Math.max(rel_left, rel_right);
		var y = Math.max(rel_top, rel_bottom);
		
		
		var X, Y, dir, border;
		if (x < y) // check X-axis
		{
			if (bullet.vector[0] < 0) // check left border
			{
				border = "LEFT";
				dir = "RIGHT";
				X = tile.x_abs - tile.size * Math.floor(Math.abs(left) / 2);
			}
			else // check left border
			{
				border = "RIGHT";
				dir = "LEFT";
				X = tile.x_abs + tile.size + tile.size * Math.floor(Math.abs(right) / 2);
			}
			Y = X * s + b;
		}
		else if (y < x) // check Y-axis
		{
			if (bullet.vector[1] < 0) // check top border
			{
				border = "TOP";
				dir = "DOWN";
				Y = tile.y_abs - tile.size * Math.floor(Math.abs(top) / 2);
			}
			else // check bottom border
			{
				border = "BOTTOM";
				dir = "UP";
				Y = tile.y_abs + tile.size + tile.size * Math.floor(Math.abs(bottom) / 2);
			}
			X = (Y - b) / s;
		}
		else // hmm
		{
			
		}
		
		var distance_to_border = bullet.distanceTo(X, Y);
		var step = Math.min(distance_to_border, distance);
		
		var next_tile = this.map.getTile(tile.x - (border == "LEFT" ? 1 : 0) + (border == "RIGHT" ? 1 : 0), tile.y - (border == "TOP" ? 1 : 0) + (border == "BOTTOM" ? 1 : 0));
		
		
		if (distance_to_border <= distance)
		{
			if (next_tile.type == 1) console.log(">> COLLISION!");
			
			bullet.x = X;
			bullet.y = Y;
			
			if (next_tile && next_tile.type == 1)
			{
				bullet.bounce(dir);
			}
			
			distance -= distance_to_border;
			return this.bullet_helper(bullet, distance);
		}
		else
		{
			bullet.move(distance);
		}
	}
	
	
	updateLoop()
	{
		if (this.state != "running") return;
		
		// update tank positions
		for (var t in this.tanks)
		{
			var tank = this.tanks[t];
			var x = tank.x,
				y = tank.y;
			
			if (tank.health <= 0) continue;
			tank.update();
			
			var tiles = this.map.checkCollision(tank);
			if (tiles)
			{
				tank.x = x;
				tank.y = y;
			}
		}
		
		
		// update bullet positions
		for (var b in this.bullets)
		{
			var bullet = this.bullets[b];
			this.bullet_helper(bullet, bullet.speed);
			
			
			// check tanks for hits
			for (var t in this.tanks)
			{
				var tank = this.tanks[t];
				if (this.checkCollision(tank, bullet))
				{
					console.log("T:"+tank.id+" hit by B:"+bullet.id);
					tank.registerHit(bullet);
					break;
				}
			}
		}
		
		
		// update powerups
		this.powerup_cooldown--;
		if (this.powerup_cooldown <= 0)
		{
			this.map.spawnPowerup();
			this.powerup_cooldown = Math.round(Math.random() * (this.powerup_cooldown_max*this.FPS-this.powerup_cooldown_min*this.FPS) + this.powerup_cooldown_min*this.FPS);
		}
		
		loop:
		for (var p in this.map.powerups)
		{
			var powerup = this.map.powerups[p];
			
			for (var t in this.tanks)
			{
				var tank = this.tanks[t];
				if (powerup.distanceTo(tank) < tank.hitbox_r + powerup.size/2)
				{
					tank.pickUpPowerup(powerup);
					this.map.despawnPowerup(powerup.id);
					continue loop;
				}
			}
		}
		
		
		
		
		this.sockets.emit("update", {graveyard: this.graveyard.map(function(t){t.socket=null;return t;}), bullets: this.bullets, tanks: this.tanks.map(function(t){t.socket=null;return t;}), powerups: this.map.powerups});
		
		var self = this;
		setTimeout(function()
		{
			self.updateLoop();
		}, 1000/self.FPS);
	}
}

module.exports = GameEngine;