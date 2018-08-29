const EventEmitter2 = require("eventemitter2").EventEmitter2;
const Tank = require("./Tank.js");
const Bullet = require("./Bullet.js");
const crypto = require("crypto");


class Player extends EventEmitter2
{
	constructor(name, socket)
	{
		super();
		
		var self = this;
		
		this.id = crypto.createHash("md5").update(socket.handshake.address).digest("hex");;
		this.name = name;
		this.kills = 0;
		this.deaths = 0;
		
		console.log("'"+this.name+"' <"+this.id+"> joined the battleground");
		
		this.color = null;
		
		this.tank = null;
		
		this.socket = socket;
		
		// disconnect
		this.socket.on("disconnect", function()
		{
			self.emit("disconnect");
		});
		
		this.ping = 0;
		this.checkPing();
		
		// player joystick input
		this.socket.on("move", function(a, s)
		{
			if (self.tank == null) return false;
			
			if (a != null && s != null)
			{
				self.tank.setAngle(a);
				self.tank.setSpeed(s);
			}
			else
			{
				self.tank.setSpeed(0);
			}
		});
		
		// player fire-button input
		this.socket.on("shoot", function()
		{
			if (self.tank == null) return false;
			
			self.tank.shoot();
		});
		
		// player powerup-button input
		this.socket.on("activatePowerup", function()
		{
			if (self.tank == null) return false;
			
			self.tank.activatePowerup();
		});
		
		// player respawn
		this.socket.on("respawn", function()
		{
			self.emit("respawn");
		});
	}
	
	checkPing()
	{
		var self = this;
		var now = Date.now();
		this.socket.emit("ping", function()
		{
			self.ping = Date.now() - now;
			setTimeout(function()
			{
				self.checkPing();
			}, 1000);
			self.socket.emit("updatePing", self.ping);
		});
	}
	
	setColor(c)
	{
		this.color = c;
	}
	
	toObject()
	{
		return {
			id: this.id,
			name: this.name,
			color: this.color,
			kills: this.kills,
			deaths: this.deaths,
			alive: (this.tank != null),
			ping: this.ping,
			kd: this.deaths > 0 ? this.kills/this.deaths : this.kills
		};
	}
}

module.exports = Player;