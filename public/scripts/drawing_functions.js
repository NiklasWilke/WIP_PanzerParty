Array.min = function(array)
{
	return Math.min.apply(Math, array);
};
Array.max = function(array)
{
	return Math.max.apply(Math, array);
};

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
}


// set size
CanvasRenderingContext2D.prototype.setSize = function(w, h)
{
	this.canvas.width = w;
	this.canvas.height = h;
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
CanvasRenderingContext2D.prototype.drawLevel = function(level)
{
	if (level == null) return false;
	
	console.log("drawLevel >> ", level);
	
	var f = this.canvas.height / 100;
	var tiles = level.tiles;
	var color = {h: level.color.h, s: level.color.s, l: level.color.l};
	var shapes = level.shapes;
	var w = h = (100/tiles.length)*f;
	var color_range = 22.5;
	
	this.clear();
	
	
	// draw shapes
	for (var s=0; s<shapes.length; s++)
	{
		var shape = shapes[s];
		shape.color = color;
		shape.color.h = Math.round((color.h + (s%2==0 ? 1 : -1) * color_range * (s / shapes.length)) % 360);
		
		console.log("shape#"+s+" >> ", shape.color);
		
		
		this.beginPath();
		for (var p in shape.path)
		{
			var pos = shape.path[p];
			if (p == 0)
			{
				this.moveTo(pos.x*w, pos.y*h);
			}
			else
			{
				this.lineTo(pos.x*w, pos.y*h);
			}
		}
		this.fillStyle = "hsl("+shape.color.h+", "+shape.color.s+"%, "+shape.color.l+"%)";
		
		this.fill();
		
		this.lineWidth = 2;
		this.strokeStyle = "hsl("+shape.color.h+", "+shape.color.s+"%, "+(shape.color.l*0.7)+"%)";
		if (s > 0) this.stroke();
		this.closePath();
		
		
		// erase free spaces
		this.globalCompositeOperation = "xor";
		this.beginPath();
		for (var c in shape.cutouts)
		{
			for (var p in shape.cutouts[c])
			{
				var pos = shape.cutouts[c][p];
				if (p == 0)
				{
					this.moveTo(pos.x*w, pos.y*h);
				}
				else
				{
					this.lineTo(pos.x*w, pos.y*h);
				}
			}
		}
		this.fillStyle = "#fff";
		this.fill();
		this.closePath();
		this.globalCompositeOperation = "source-over";
		
		
		
		// draw outline
		this.beginPath();
		for (var c in shape.cutouts)
		{
			for (var p in shape.cutouts[c])
			{
				var pos = shape.cutouts[c][p];
				if (p == 0)
				{
					this.moveTo(pos.x*w, pos.y*h);
				}
				else
				{
					this.lineTo(pos.x*w, pos.y*h);
				}
			}
		}
		
		this.lineWidth = 2;
		this.strokeStyle = "hsl("+shape.color.h+", "+shape.color.s+"%, "+(shape.color.l*0.7)+"%)";
		this.stroke();
		this.closePath();
	}
	
	
	// DEV grid
	// for (var y=0; y<tiles.length; y++)
	// {
		// for (var x=0; x<tiles.length; x++)
		// {
			// this.beginPath();
			// this.rect(x*w, y*h, w, h);
			// this.strokeStyle = "rgba(0, 0, 0, 0.1)";
			// this.stroke();
			
			// this.font = "7px Arial";
			// this.textAlign = "center";
			// this.textBaseline = "middle";
			// this.fillStyle = "rgba(0, 0, 0, 1)";
			// this.fillText(x+"/"+y, (x+0.5)*w, (y+0.5)*h);
		// }
	// }
	
	
	// draw powerup spawn locations
	// for (var p in level.powerup_locations)
	// {
		// var pos = level.powerup_locations[p];
		
		// this.beginPath();
		// this.arc(pos.x*f, pos.y*f, 0.24*w, 0, 2*Math.PI);
		// this.fillStyle = "hsl("+color.h+", "+(color.s*0.2)+"%, "+(100-(100-color.l)*0.5)+"%)";
		// this.fill();
		// this.strokeStyle = "hsl("+color.h+", "+(color.s*0.2)+"%, "+(100-(100-color.l)*0.7)+"%)";
		// this.stroke();
		// this.closePath();
		
		// this.beginPath();
		// this.arc(pos.x*f, pos.y*f, 0.1*w, 0, 2*Math.PI);
		// this.fillStyle = "hsl("+((color.h + 60) % 360)+", "+(color.s)+"%, "+(100-(100-color.l)*1)+"%)"; //"#eee";
		// this.fill();
		// this.closePath();
	// }
}


// draws tank
CanvasRenderingContext2D.prototype.drawTank = function(tank)
{
	var f = this.canvas.height / 100;
	
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


// draws gravestone
CanvasRenderingContext2D.prototype.drawGravestone = function(tank)
{
	var f = this.canvas.height / 100;
	
	var w = tank.width*f;
	var h = tank.height*f;
	
	var size = tank.width*f * 0.25;
	this.beginPath();
	this.moveTo(tank.x*f - size, tank.y*f - size);
	this.lineTo(tank.x*f + size, tank.y*f + size);
	this.moveTo(tank.x*f + size, tank.y*f - size);
	this.lineTo(tank.x*f - size, tank.y*f + size);
	this.lineWidth = 0.4*f;
	this.strokeStyle = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(100-(100-tank.color.l)*0.6)+"%)";
	this.stroke();
	this.closePath();
	
	this.lineWidth = 1;
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
	this.roundRect(-h+w/2, -w/2, h, w, {tl: 0, tr: w*0.5, br: w*0.5, bl: 0});
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
	
	var powerup_color = powerup.color;
	
	// base
	this.beginPath();
	this.arc(x, y, r, 0, 2*Math.PI);
	this.fillStyle = "hsl("+powerup.color.h+", "+powerup.color.s+"%, "+(powerup.color.l)+"%)";
	this.fill();
	this.lineWidth = 1;
	this.strokeStyle = "hsl("+powerup.color.h+", "+powerup.color.s+"%, "+(powerup.color.l*0.9)+"%)";
	this.stroke();
	this.closePath();
	
	// highlight
	// this.beginPath();
	// this.ellipse(x - 0.08*r, y - 0.21*r, 0.9*r, 0.7*r, toRadians(-20), 1*Math.PI, 2*Math.PI);
	// this.ellipse(x - 0.08*r, y - 0.21*r, 0.9*r, 0.2*r, toRadians(-20), 0*Math.PI, 1*Math.PI);
	// this.fillStyle = "hsl("+powerup_color.h+", "+powerup_color.s+"%, "+(100-(100-powerup_color.l)*0.9)+"%)";
	// this.fill();
	// this.closePath();
	
	// shadow
	// this.beginPath();
	// this.ellipse(x + 0.08*r, y + 0.22*r, 0.9*r, 0.7*r, toRadians(160), 1*Math.PI, 2*Math.PI);
	// this.ellipse(x + 0.08*r, y + 0.22*r, 0.9*r, 0.2*r, toRadians(160), 0*Math.PI, 1*Math.PI);
	// this.fillStyle = "hsl("+powerup_color.h+", "+powerup_color.s+"%, "+(powerup_color.l*0.92)+"%)";
	// this.fill();
	// this.closePath();
	
	if (powerup.type == "emp")
	{
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
	else if (powerup.type == "bullet")
	{
		var h = Math.sqrt(2*Math.pow(r, 2)) * 0.85;
		var w = h * 0.35;
		
		// bullet body
		this.beginPath();
		this.roundRect(x-w/2, y-h/2, w, h*0.7, {tl: w*0.5, tr: w*0.5, br: 0, bl: 0});
		this.fillStyle = "hsl("+powerup.color.h+", "+powerup.color.s+"%, 100%)";
		this.fill();
		this.closePath();
		
		// bullet detail
		this.beginPath();
		this.rect(x-w/2, y+h*0.22, w, h*0.3);
		this.fillStyle = "hsl("+powerup.color.h+", "+powerup.color.s+"%, 90%)";
		this.fill();
		this.closePath();
	}
}

CanvasRenderingContext2D.prototype.drawBeacon = function(beacon)
{
	var f = this.canvas.height / 100;
	this.beginPath();
	this.arc(beacon.x*f, beacon.y*f, beacon.r*f, 0, 2*Math.PI);
	this.lineWidth = 2;
	this.fillStyle = "hsla("+beacon.color.h+", "+beacon.color.s+"%, "+beacon.color.l+"%, "+(0.4*Math.min(1, (beacon.max_r - beacon.r) / beacon.max_r * 2))+")";
	this.fill();
	this.closePath();
}

CanvasRenderingContext2D.prototype.drawExplosion = function(explosion)
{
	var f = this.canvas.height / 100;
	for (var p in explosion.particles)
	{
		var particle = explosion.particles[p];
		this.beginPath();
		this.arc((explosion.x+particle.x)*f, (explosion.y+particle.y)*f, particle.r*f, 0, 2*Math.PI);
		this.fillStyle = "hsla("+particle.color.h+", "+particle.color.s+"%, "+particle.color.l+"%, "+particle.opacity+")";
		this.fill();
	}
}