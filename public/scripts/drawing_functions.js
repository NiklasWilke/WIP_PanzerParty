function toDegrees(angle)
{
	return angle * (180 / Math.PI);
}
function toRadians(angle)
{
	return angle * (Math.PI / 180);
}


// clear
CanvasRenderingContext2D.prototype.prepare = function()
{
	this.canvas.width = this.canvas.innerWidth;
	this.canvas.height = this.canvas.innerHeight;
	this.clear();
}


// clear
CanvasRenderingContext2D.prototype.clear = function()
{
	this.clearRect(0, 0, this.canvas.width, this.canvas.height);
}


// rounded rectangles
CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius, fill, stroke)
{
	if (typeof stroke == 'undefined')
	{
		stroke = true;
	}
	if (typeof radius === 'undefined')
	{
		radius = 5;
	}
	if (typeof radius === 'number')
	{
		radius = {tl: radius, tr: radius, br: radius, bl: radius};
	}
	else
	{
		var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
		for (var side in defaultRadius)
		{
			radius[side] = radius[side] || defaultRadius[side];
		}
	}
	
	this.moveTo(x + radius.tl, y);
	this.lineTo(x + width - radius.tr, y);
	this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
	this.lineTo(x + width, y + height - radius.br);
	this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
	this.lineTo(x + radius.bl, y + height);
	this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
	this.lineTo(x, y + radius.tl);
	this.quadraticCurveTo(x, y, x + radius.tl, y);
}


// draw Level
CanvasRenderingContext2D.prototype.drawLevel = function(map)
{
	if (map == null) return false;
	
	var f = this.canvas.height / 100;
	var tiles = map.tiles;
	var color = map.color;
	var w = h = (100/tiles.length)*f;
	
	this.clear();
	
	// get shapes
	var checked = [];
	var shapes = [];
	var check = function(x, y)
	{
		var p = x+";"+y;
		
		if (y < 0 || y >= tiles.length || x < 0 || x >= tiles[y].length) return [];
		if (checked.indexOf(p) !== -1) return [];
		checked.push(p);
		if (tiles[y][x] !== 1) return [];
		
		var result = [p].concat(
			check(x, y-1),
			check(x, y+1),
			check(x-1, y),
			check(x+1, y)
		);
		
		return result;
	}
	for (var y=0; y<tiles.length; y++)
	{
		for (var x=0; x<tiles[y].length; x++)
		{
			var tile = tiles[y][x];
			
			if (tile == 1)
			{
				var res = check(x, y);
				if (res.length > 0)
				{
					shapes.push(res);
				}
			}
		}
	}
	console.log("shapes: ", shapes);
	
	// draw wall tiles
	for (var s=0; s<shapes.length; s++)
	{
		if (s > 1) break;
		var shape = shapes[s];
		for (var p in shape)
		{
			var pos = shape[p].split(";");
			var x = pos[0];
			var y = pos[1];
			
			this.beginPath();
			this.rect(x*w, y*h, w, h);
			this.fillStyle = "hsla("+((color.h + 360 * ((s+1) / shapes.length)) % 360)+", "+color.s+"%, "+color.l+"%, 0.8)";
			this.fill();
			//this.strokeStyle = "hsl("+((color.h + 360 * ((s+1) / shapes.length)) % 360)+", "+color.s+"%, "+(color.l*0.9)+"%)";
			//this.lineWidth = 2;
			//this.stroke();
			this.closePath();
			
			this.lineWidth = 1;
		}
	}
	
	// calculate shape path
	shapes.splice(0, 1);
	for (var s=0; s<shapes.length; s++)
	{
		var shape = shapes[s];
		var tiles = shape.slice(0).map(function(t)
		{
			t = t.split(";");
			return {x: parseInt(t[0]), y: parseInt(t[1])};
		});
		tiles.sort(function(a,b)
		{
			if (a.y > b.y)
				return 1;
			if (a.y < b.y)
				return -1;
			else
				return (a.x > b.x) ? 1 : -1;
		});
		
		//console.log("shape #"+(s+1), tiles[0], " x ", tiles[tiles.length-1]);
		
		var start = tiles[0];
		
		var helper = function(pos, dir, path)
		{
			if (typeof path == "undefined") path = [];
			if (pos.x == start.x && pos.y == start.y && path.length > 0)
			{
				path.push(start);
				return path;
			}
			var current = path.length > 0 ? path[path.length-1] : pos;
			
			
			if (shape.indexOf(pos.x+";"+pos.y) !== -1)
			{
				//console.log("at ", pos);
				//console.log(pos, dir+"°");
				
				for (var i=0; i<4; i++)
				{
					var angle = (dir-90) + 90*i;
					var tmp = {
						x: pos.x + Math.round(Math.cos(toRadians(angle))),
						y: pos.y + Math.round(Math.sin(toRadians(angle)))
					};
					
					var _path = helper(tmp, angle, path);
					if (_path) return _path;
				
					path.push({
						x: current.x + Math.round(Math.cos(toRadians(angle+90))),
						y: current.y + Math.round(Math.sin(toRadians(angle+90)))
					});
					current = path[path.length-1];
				}
				
				return false;
			}
			else
			{
				return false;
			}
		}
		
		var path = helper(start, 0);
		
		
		this.beginPath();
		this.moveTo(start.x*w, start.y*h);
		for (var p in path)
		{
			var pos = path[p];
			this.lineTo(pos.x*w, pos.y*h);
		}
		
		this.fillStyle = "hsl("+((color.h + 360 * ((s+1) / shapes.length)) % 360)+", "+color.s+"%, "+color.l+"%)";
		this.fill();
		
		this.lineWidth = 2;
		this.strokeStyle = "hsl("+((color.h + 360 * ((s+1) / shapes.length)) % 360)+", "+color.s+"%, "+(color.l*0.7)+"%)";
		this.stroke();
		this.closePath();
	}
	
	
	// draw powerup spawn locations
	for (var p in map.powerup_locations)
	{
		var pos = map.powerup_locations[p];
		
		this.beginPath();
		this.arc(pos.x*f, pos.y*f, 0.24*w, 0, 2*Math.PI);
		this.fillStyle = "hsl("+color.h+", "+(color.s*0.2)+"%, "+(100-(100-color.l)*0.5)+"%)";
		this.fill();
		this.strokeStyle = "hsl("+color.h+", "+(color.s*0.2)+"%, "+(100-(100-color.l)*0.7)+"%)";
		this.stroke();
		this.closePath();
		
		this.beginPath();
		this.arc(pos.x*f, pos.y*f, 0.1*w, 0, 2*Math.PI);
		this.fillStyle = "hsl("+((color.h + 60) % 360)+", "+(color.s)+"%, "+(100-(100-color.l)*1)+"%)"; //"#eee";
		this.fill();
		this.closePath();
	}
}


// draws tank
CanvasRenderingContext2D.prototype.drawTank = function(tank)
{
	var f = this.canvas.height / 100;
	if (tank.health > 0)
	{
		this.translate(tank.x*f, tank.y*f);
		this.rotate(tank.angle * Math.PI/180);
		
		var w = tank.width*f;
		var h = tank.height*f;
		
		// body
		this.beginPath();
		this.roundRect(-h/2, -w/2, h, w, w*0.15);
		this.fillStyle = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*1)+"%)";
		this.fill();
		//this.strokeStyle = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*0.9)+"%)";
		//this.stroke();
		this.closePath();
		
		
		// front lights
		this.beginPath();
		this.roundRect(h/2 - h*0.1, -w/2 + 0.15*w, h*0.1, w*0.18, {tl: w*0.1, tr: 0, br: 0, bl: w*0.1});
		this.roundRect(h/2 - h*0.1, w/2 - 0.15*w - 0.18*w, h*0.1, w*0.18, {tl: w*0.1, tr: 0, br: 0, bl: w*0.1});
		this.fillStyle = tank.speed > 0 ? "hsl(48, 89%, 50%)" : "hsl(48, 30%, 50%)";
		this.fill();
		this.closePath();
		
		// back lights
		this.beginPath();
		this.roundRect(-h/2, -w/2 + 0.18*w, h*0.06, w*0.18, {tl: 0, tr: w*0.1, br: w*0.1, bl: 0});
		this.roundRect(-h/2, w/2 - 0.18*w - 0.18*w, h*0.06, w*0.18, {tl: 0, tr: w*0.1, br: w*0.1, bl: 0});
		this.fillStyle = tank.speed == 0 ? "hsl(350, 82%, 61%)" : "hsl(350, 30%, 61%)";
		this.fill();
		this.closePath();
		
		
		// pipe
		this.beginPath();
		this.roundRect(h*0.3/2, -w*0.2/2, h*0.45, w*0.2, w*0.05);
		this.fillStyle = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*0.7)+"%)";
		this.fill();
		this.closePath();
		
		// head
		this.beginPath();
		this.roundRect(-h*0.38, -w*0.7/2, h*0.6, w*0.7, w*0.15);
		this.fillStyle = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*0.75)+"%)";
		this.fill();
		this.closePath();
		
		// details
		this.beginPath();
		this.arc(-h*0.15, -w*0.07, w*0.16, 0, 2*Math.PI);
		this.rect(h*0.02, -w*0.26, h*0.1, w*0.3);
		this.rect(-h*0.28, w*0.14, h*0.4, w*0.1);
		this.fillStyle = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*0.65)+"%)";
		this.fill();
		this.closePath();
		
		// hitbox
		// this.beginPath();
		// this.arc(0, 0, tank.hitbox_r*f, 0, 2*Math.PI);
		// this.fillStyle = "rgba(0, 0, 0, 0.3)";
		// this.fill();
		// this.closePath();
		
		this.rotate(-tank.angle * Math.PI/180);
		this.translate(-tank.x*f, -tank.y*f);
	}
	else
	{
		var size = tank.width*f * 0.3;
		this.beginPath();
		this.moveTo(tank.x*f - size, tank.y*f - size);
		this.lineTo(tank.x*f + size, tank.y*f + size);
		this.moveTo(tank.x*f + size, tank.y*f - size);
		this.lineTo(tank.x*f - size, tank.y*f + size);
		this.lineWidth = 0.5*f;
		this.strokeStyle = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l)+"%)";
		this.stroke();
		this.closePath();
		
		this.lineWidth = 1;
	}
}

CanvasRenderingContext2D.prototype.drawBullet = function(bullet)
{
	var f = this.canvas.height / 100;
	var h = 0.8*f;
	var w = 0.3*f;
	
	this.translate(bullet.x*f, bullet.y*f);
	this.rotate(bullet.angle * Math.PI/180);
	
	// body
	this.beginPath();
	this.roundRect(-h, -w/2, h, w, {tl: 0, tr: w*0.5, br: w*0.5, bl: 0});
	this.fillStyle = "hsl("+bullet.color.h+", "+bullet.color.s+"%, "+(bullet.color.l*0.5)+"%)";
	this.fill();
	this.closePath();
	
	// detail
	this.beginPath();
	this.rect(-h, -w/2, h*0.3, w);
	this.fillStyle = "hsl("+bullet.color.h+", "+(bullet.color.s*0.95)+"%, "+(bullet.color.l*0.75)+"%)";
	this.fill();
	this.closePath();
	
	this.rotate(-bullet.angle * Math.PI/180);
	this.translate(-bullet.x*f, -bullet.y*f);
}

CanvasRenderingContext2D.prototype.drawPowerup = function(powerup)
{
	var f = this.canvas.height / 100;
	var x = powerup.x*f,
		y = powerup.y*f,
		r = powerup.size/2*f;
		
	// var powerup_color = {
		// h: ((color.h + 60) % 360),
		// s: 70,
		// l: 50
	// };
	var powerup_color = powerup.color;
	
	// base
	this.beginPath();
	this.arc(x, y, r, 0, 2*Math.PI);
	this.fillStyle = "hsl("+powerup_color.h+", "+powerup_color.s+"%, "+(powerup_color.l)+"%)";
	this.fill();
	this.lineWidth = 2;
	this.strokeStyle = "hsl("+powerup_color.h+", "+powerup_color.s+"%, "+(powerup_color.l*0.9)+"%)";
	this.stroke();
	this.closePath();
	
	this.lineWidth = 1;
	
	// highlight
	this.beginPath();
	this.ellipse(x - 0.08*r, y - 0.21*r, 0.9*r, 0.7*r, toRadians(-20), 1*Math.PI, 2*Math.PI);
	this.ellipse(x - 0.08*r, y - 0.21*r, 0.9*r, 0.2*r, toRadians(-20), 0*Math.PI, 1*Math.PI);
	this.fillStyle = "hsl("+powerup_color.h+", "+powerup_color.s+"%, "+(100-(100-powerup_color.l)*0.85)+"%)";
	this.fill();
	this.closePath();
	
	// shadow
	this.beginPath();
	this.ellipse(x + 0.08*r, y + 0.22*r, 0.9*r, 0.7*r, toRadians(160), 1*Math.PI, 2*Math.PI);
	this.ellipse(x + 0.08*r, y + 0.22*r, 0.9*r, 0.2*r, toRadians(160), 0*Math.PI, 1*Math.PI);
	this.fillStyle = "hsl("+powerup_color.h+", "+powerup_color.s+"%, "+(powerup_color.l*0.92)+"%)";
	this.fill();
	this.closePath();
	
	// lightning
	var h = Math.sqrt(2*Math.pow(r, 2));
	var w = h * 0.6;
	this.beginPath();
	this.moveTo(x + w*0.3, y-h*0.5);
	this.lineTo(x + w*0.1, y-h*0.1);
	this.lineTo(x + w*0.5, y-h*0.1);
	
	this.lineTo(x - w*0.3, y+h*0.5);
	this.lineTo(x - w*0.1, y+h*0.1);
	this.lineTo(x - w*0.5, y+h*0.1);
	this.fillStyle = "#fff";
	this.fill();
	this.closePath();
}

CanvasRenderingContext2D.prototype.drawBeacon = function(beacon)
{
	var f = this.canvas.height / 100;
	this.beginPath();
	this.arc(beacon.x*f, beacon.y*f, beacon.r*f, 0, 2*Math.PI);
	this.lineWidth = 2;
	this.fillStyle = "rgba("+beacon.color.r+", "+beacon.color.g+", "+beacon.color.b+", "+(0.4*Math.min(1, (beacon.max_r - beacon.r) / beacon.max_r * 2))+")";
	this.fill();
	this.closePath();
}