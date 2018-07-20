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

class GameEngine
{
	constructor(io)
	{
		console.log("ini GameEngine");
		
		var self = this;
		
		this.io = io;
		this.sockets = io.sockets;
		
		this.id = crypto.createHash("md5").update(Math.round(Math.random()*89999+10000)+"").digest("hex");
		this.players = [];
		this.tanks = [];
		this.graveyard = [];
		this.bullets = [];
		
		this.levels = [];
		var files = fs.readdirSync("./data/maps");
		for (var f in files)
		{
			self.levels.push(new Level("../data/maps/"+files[f]));
		}
		
		this.map = new Map(this.levels[Math.floor(Math.random()*this.levels.length)]);
		
		this.powerup_cooldown_max = 12;		
		this.powerup_cooldown_min = 6;
		this.powerup_cooldown = this.powerup_cooldown_min;
		
		this.io.on("connection", function(socket)
		{
			socket.emit("renderMap", {
				tiles: self.map.tiles,
				powerups: self.map.powerups
			});
			
			// player login with name, color (tbd) etc.
			socket.on("join", function(name, callback)
			{
				var player = self.addPlayer(name, socket);
				
				callback({color: player.color});
			});
			
			socket.emit("updateScoreboard", self.players.map(function(p){return p.toObject();}));
		});
		
		this.updateLoop();
	}
	
	
	addPlayer(name, socket)
	{
		var self = this;
		
		var player = new Player(name, socket);
		this.players.push(player);
		player.on("disconnect", function()
		{
			for (var p in self.players)
			{
				if (self.players[p].id == player.id)
				{
					self.players.splice(p, 1);
					break;
				}
			}
		});
		
		player.on("respawn", function()
		{
			self.spawnTank(player);
		});
		
		self.spawnTank(player);
		self.updateScoreboard();
		
		return player;
	}
	
	getPlayerById(id)
	{
		for (var p in self.players)
		{
			if (self.players[p].id == id)
			{
				return self.players[p];
				break;
			}
		}
	}
	
	updateScoreboard()
	{
		var list = this.players.map(function(p){return p.toObject();});
		list = list.sort(function(a,b)
		{
			if (a.kills < b.kills)
				return 1;
			if (a.kills > b.kills)
				return -1;
			else
				return (a.deaths > b.deaths ? 1 : -1);
		});
		
		this.io.sockets.emit("updateScoreboard", list);
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
			console.log(tank.id+" fired B#"+bullet.id);
			self.bullets.push(bullet);
			self.io.sockets.emit("shotFired");
		});
		tank.on("death", function(killer)
		{
			player.deaths++;
			self.io.sockets.emit("kill", killer.player, tank.player);
			player.tank = null;
			
			player.socket.emit("death", (killer.id == tank.id) ? null : killer);
			
			self.updateScoreboard();
			
			// despawn tank
			for (var t in self.tanks)
			{
				if (self.tanks[t].id == tank.id)
				{
					self.graveyard.push(tank);
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
	}
	
	
	getLevels()
	{
		return this.levels;
	}
	
	getLevel(id)
	{
		for (var l in this.levels)
		{
			if (this.levels[l].id == id) return this.levels[l];
		}
		return null;
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
			
			var tiles = this.map.checkCollision(tank);
			if (tiles)
			{
				//console.log("COLLISION ", tiles.map(function(t){return [t.x, t.y]}));
				
				tank.x = x;
				tank.y = y;
			}
		}
		
		
		// update bullet positions
		for (var b in this.bullets)
		{
			var bullet = this.bullets[b];
			bullet.update();
			
			var tile = this.map.checkCollision(bullet);
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
			this.map.spawnPowerup();
			this.powerup_cooldown = Math.round(Math.random() * (this.powerup_cooldown_max*60-this.powerup_cooldown_min*60) + this.powerup_cooldown_min*60);
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
		
		
		
		
		this.sockets.emit("update", {bullets: this.bullets, tanks: this.tanks.map(function(t){t.socket=null;return t;}), powerups: this.map.powerups});
		
		var self = this;
		setTimeout(function()
		{
			self.updateLoop();
		}, 1000/60);
	}
}

module.exports = GameEngine;