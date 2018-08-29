const crypto = require("crypto");
const fs = require("fs");

const powerups = [];
var dr = 0;
var files = fs.readdirSync("./data/powerups");
for (var f in files)
{
	var p = require("../data/powerups/"+files[f]);
	dr += p.droprate;
	powerups.push(p);
}

class Powerup
{
	constructor(_x, _y)
	{
		this.id = crypto.createHash("md5").update(""+_x+Math.round(Math.random()*89999+10000)+_y).digest("hex");
		this.x = _x;
		this.y = _y;
		this.size = 2.2;
		
		// select random powerup
		var rand = Math.random()*dr;
		var p;
		for (p in powerups)
		{
			rand -= powerups[p].droprate;
			if (rand <= 0) break;
		}
		var powerup = powerups[p];
		
		
		for (var attr in powerup)
		{
			this[attr] = powerup[attr];
		}
		this.total_duration = this.duration;
		this.color._l = this.color.l;
	}
	
	distanceTo(obj)
	{
		return Math.sqrt(Math.pow(this.x - obj.x, 2) + Math.pow(this.y - obj.y, 2));
	}
}

module.exports = Powerup;