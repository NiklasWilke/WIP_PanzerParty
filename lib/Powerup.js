const crypto = require("crypto");
const fs = require("fs");

const powerups = [];
var files = fs.readdirSync("./data/powerups");
for (var f in files)
{
	powerups.push(require("../data/powerups/"+files[f]));
}

class Powerup
{
	constructor(_x, _y)
	{
		this.id = crypto.createHash("md5").update(""+_x+Math.round(Math.random()*89999+10000)+_y).digest("hex");
		this.x = _x;
		this.y = _y;
		this.size = 2.2;
		
		var p = powerups[Math.floor(Math.random()*powerups.length)];
		for (var attr in p)
		{
			this[attr] = p[attr];
		}
		this.color._l = this.color.l;
	}
	
	distanceTo(obj)
	{
		return Math.sqrt(Math.pow(this.x - obj.x, 2) + Math.pow(this.y - obj.y, 2));
	}
}

module.exports = Powerup;