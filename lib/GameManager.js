const crypto = require("crypto");
const fs = require("fs");

const Point = require("./Point.js");
const Player = require("./Player.js");
const Level = require("./Level.js");
const Map = require("./Map.js");
const Powerup = require("./Powerup.js");
const Bullet = require("./Bullet.js");
const Tank = require("./Tank.js");
const GameEngine = require("./GameEngine.js");

function toDegrees(angle)
{
	return angle * (180 / Math.PI);
}
function toRadians(angle)
{
	return angle * (Math.PI / 180);
}

class GameManager
{
	constructor(io)
	{
		console.log("ini GameManager");
		
		var self = this;
		
		this.io = io;
		this.sockets = io.sockets;
		
		this.players = [];
		
		this.levels = [];
		var files = fs.readdirSync("./data/maps");
		for (var f in files)
		{
			self.levels.push(new Level("../data/maps/"+files[f]));
		}
		
		this.io.on("connection", function(socket)
		{
			socket.emit("updateGameState", self.game.state);
			
			// player login with name, color (tbd) etc.
			socket.on("join", function(name, color, callback)
			{
				var player = self.addPlayer(name, color, socket);
				
				callback({color: player.color});
			});
			
			socket.on("selectLevel", function(level_id)
			{
				console.log("set level >", level_id);
				var level = self.getLevel(level_id);
				self.setLevel(level);
			});
			
			socket.on("startGame", function()
			{
				self.startGame();
			});
			
			socket.on("stopGame", function(callback)
			{
				self.stopGame();
				callback();
			});
			
			socket.on("getLevel", function(id, callback)
			{
				callback(self.getLevel(id));
			});
			
			socket.on("getLevels", function(callback)
			{
				callback(self.levels);
			});
			
			socket.on("saveLevel", function(file_name, name, level, callback)
			{
				console.log("saving level '"+name+"' to '"+file_name+"'");
				var json = JSON.stringify({name: name, tiles: level});
				fs.writeFile("./data/maps/"+file_name, json, "utf8", function(res)
				{
					var level = new Level("../data/maps/"+file_name);
					for (var l in self.levels)
					{
						if (self.levels[l].id == level.id)
						{
							self.levels.splice(l, 1);
							break;
						}
					}
					self.levels.push(level);
				});
			});
			
			
			if (self.game.map && self.game.state == "running") socket.emit("renderMap", self.game.map);
			if (self.game.state != "running") socket.emit("setLevels", self.levels);
			
			socket.emit("updateScoreboard", self.players.map(function(p){return p.toObject();}));
		});
		
		this.game = new GameEngine(io);
		this.game.on("updateScoreboard", function()
		{
			self.updateScoreboard();
		});
		this.game.on("changedState", function(new_state)
		{
			self.sockets.emit("updateGameState", new_state);
		});
	}
	
	
	startGame()
	{
		console.log("start game");
		this.game.start();
	}
	
	
	stopGame()
	{
		console.log("stop game");
		this.game.stop();
	}
	
	getGameState()
	{
		return this.game.getState();
	}
	
	setLevel(level)
	{
		this.game.setLevel(level);
		this.io.sockets.emit("renderMap", this.game.map);
		this.startGame();
	}
	
	
	addPlayer(name, color, socket)
	{
		var self = this;
		
		var player = new Player(name, socket);
		player.setColor(color);
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
			self.game.spawnTank(player);
		});
		
		self.game.spawnTank(player);
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
}

module.exports = GameManager;