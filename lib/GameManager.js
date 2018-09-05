const EventEmitter2 = require("eventemitter2").EventEmitter2;
const crypto = require("crypto");
const fs = require("fs");

const Color = require("./Color.js");
const Point = require("./Point.js");
const Player = require("./Player.js");
const Level = require("./Level.js");
const Map = require("./Map.js");
const Powerup = require("./Powerup.js");
const Bullet = require("./Bullet.js");
const Tank = require("./Tank.js");
const Bot = require("./Bot.js")
const GameEngine = require("./GameEngine.js");

function toDegrees(angle)
{
	return angle * (180 / Math.PI);
}
function toRadians(angle)
{
	return angle * (Math.PI / 180);
}

class GameManager extends EventEmitter2
{
	constructor(io)
	{
		console.log("ini GameManager");
		super();

		var self = this;

		this.io = io;
		this.sockets = io.sockets;

		this.players = [];
		this.kill_goal = 2;

		this.levels = [];
		var files = fs.readdirSync("./data/maps");
		for (var f in files)
		{
			self.levels.push(new Level("../data/maps/"+files[f]));
		}

		this.colors = [];
		for (var h=0; h<12; h++)
		{
			this.colors.push(new Color(Math.round(h/12*360), 60, 65));
		}

		this.io.on("connection", function(socket)
		{
			self.iniClient(socket);
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
		this.game.on("ready", function()
		{
			for (var p in self.players)
			{
				var player = self.players[p];
				self.game.spawnTank(player);
			}

			//spawnbot amount
			for (var i = 0; i<1; i++)
			{
				self.game.spawnBot();
			}

			self.sockets.emit("gameReady");
		});
		this.game.on("start", function()
		{
			self.sockets.emit("gameStarted");
		});
		this.game.on("stop", function()
		{
			self.players.map(function(p)
			{
				p.kills = 0;
				p.deaths = 0;
			});
		});

		this.on("playerJoined", function(player)
		{
			console.log(player.name, " joined");
			self.updateAvailableColors();
		});
		this.on("playerExited", function(player)
		{
			console.log(player.name, " left");
			self.updateAvailableColors();
		});

		setInterval(function()
		{
			self.updatePlayers();
		}, 500);
	}


	iniClient(socket)
	{
		var self = this;

		socket.emit("updateGameState", self.game.state);

		// player login with name, color (tbd) etc.
		socket.on("join", function(name, color, callback)
		{
			color = new Color(color.h, color.s, color.l);
			var colors = self.getAvailableColors();
			for (var c in  colors)
			{
				if (colors[c].equals(color))
				{
					if (colors[c].taken) return callback({error: "Sorry, die Farbe ist bereits vergeben!"});
					break;
				}
			}

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
			console.log("socket -> start game");
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
				console.log(res);
				var level = new Level("../data/maps/"+file_name);
				for (var l in self.levels)
				{
					if (self.levels[l].id == level.id)
					{
						self.levels.splice(l, 1);
						console.log("overwritten");
						break;
					}
				}
				self.levels.push(level);
				callback(level);
			});
		});

		socket.emit("updateAvailableColors", self.getAvailableColors());

		if (self.game.map && self.game.state != "stopped") socket.emit("renderMap", self.game.map);
		if (self.game.state == "ready") socket.emit("gameReady");
		if (self.game.state != "running") socket.emit("setLevels", self.levels);

		socket.emit("updateScoreboard", self.players.map(function(p){return p.toObject();}));
	}


	iniGame()
	{
		console.log("ini game");
		this.game.ini();
	}


	startGame()
	{
		if (this.game.state != "running") this.game.start();
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
		this.iniGame();
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
			self.emit("playerExited", player);
			self.updateScoreboard();
		});

		player.on("respawn", function()
		{
			self.game.spawnTank(player);
			player.socket.emit("respawn");
		});

		if (self.game.state == "running") self.game.spawnTank(player);
		self.updateScoreboard();

		self.emit("playerJoined", player);

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

	updatePlayers()
	{
		var players = this.players.map(function(p){return p.toObject();});
		this.io.sockets.emit("updatePlayers", players);
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

		if (list[0].kills >= this.kill_goal)
		{
			this.game.end();
			this.io.sockets.emit("gameEnded", list);
		}
	}


	updateAvailableColors()
	{
		this.io.sockets.emit("updateAvailableColors", this.getAvailableColors());
	}

	getAvailableColors()
	{
		var temp = this.colors.slice(0);
		for (var c in temp)
		{
			var color = temp[c];
			temp[c].taken = this.players.filter(function(p)
			{
				return color.equals(p.color);
			}).length > 0;
		}
		return temp;
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
