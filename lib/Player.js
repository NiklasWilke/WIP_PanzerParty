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
		
		this.color = {
			h: Math.round(Math.random() * 360),
			s: Math.round(Math.random() * 40 + 30),
			l: Math.round(Math.random() * 40 + 40)
		};
		
		this.tank = null;
		
		this.socket = socket;
		
		// disconnect
		this.socket.on("disconnect", function()
		{
			self.emit("disconnect");
		});
		
		
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
		
		// player respawn
		this.socket.on("respawn", function()
		{
			// TODO
			self.emit("respawn");
		});
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
			kd: this.deaths > 0 ? this.kills/this.deaths : this.kills
		};
	}
}

module.exports = Player;