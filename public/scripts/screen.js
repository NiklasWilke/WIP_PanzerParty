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
	
	ctx.moveTo(x + radius.tl, y);
	ctx.lineTo(x + width - radius.tr, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
	ctx.lineTo(x + width, y + height - radius.br);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
	ctx.lineTo(x + radius.bl, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
	ctx.lineTo(x, y + radius.tl);
	ctx.quadraticCurveTo(x, y, x + radius.tl, y);
}


function toDegrees(angle)
{
	return angle * (180 / Math.PI);
}
function toRadians(angle)
{
	return angle * (Math.PI / 180);
}


// generates random color
function getRandomColor()
{
	return {
		h: Math.round(Math.random() * 360),
		s: Math.round(Math.random() * 10 + 25),
		l: Math.round(Math.random() * 10 + 55)
	};
}


var socket = io();

//canvas 
var canvas,
	ctx,
	lvl_canvas,
	lvl_ctx,
	f;

// map objects
var tanks = [],
	bullets = [],
	powerups = [],
	level = [[]];


// map calor
var color = getRandomColor();

console.log("Color: hsl("+color.h+", "+color.s+"%, "+color.l+"%)");


function ini()
{
	document.querySelector("#battleground").style.background = "hsla("+color.h+", "+color.s+"%, "+color.l+"%, 0.1)";
	
	canvas = document.getElementById("objects");
	lvl_canvas = document.getElementById("level");
	
	ctx = canvas.getContext("2d");
	lvl_ctx = lvl_canvas.getContext("2d");
	
	updateSize();
	loop();
}

document.addEventListener("DOMContentLoaded", ini, false);

// responsive canvas
function updateSize()
{
	f = window.innerHeight / 100;
	
	canvas.width = window.innerHeight;
	canvas.height = window.innerHeight;
	
	lvl_canvas.width = window.innerHeight;
	lvl_canvas.height = window.innerHeight;
	
	drawLevel(level);
}

window.onresize = function(e)
{
	updateSize();
};


window.requestAnimFrame = (function()
{
	return	window.requestAnimationFrame       ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			function(callback)
			{
				window.setTimeout(callback, 1000 / 60);
			};
})();

// update
socket.on("update", function(data)
{
	tanks = data.tanks;
	bullets = data.bullets;
	powerups = data.powerups;
});


// render map
socket.on("renderMap", function(map)
{
	console.log("render map > ", map);
	level = map.tiles;
	drawLevel(level);
	
	for (var p in map.powerups)
	{
		drawPowerup(map.powerups[p]);
	}
});



// sounds
socket.on("shotFired", function(msg)
{
	new Audio("/sounds/shoot.mp3").play();
});


// kill feed
socket.on("kill", function(killer, victim)
{
	console.log(killer, " > ", victim);
	
	var kill_log = document.getElementById("kill_log");
	
	var elem = document.createElement("li");
	elem.innerHTML = "<span>"+killer.name+"</span><img src='/icons/killed.svg'><span>"+victim.name+"</span>";
	kill_log.prepend(elem);
	
	window.setTimeout(function()
	{
		elem.className = "hide";
		window.setTimeout(function()
		{
			kill_log.removeChild(elem);
		}, 400);
	}, 3500);
});

function drawLevel(level)
{
	var w = h = (100/level.length)*f;

	clear(lvl_canvas);
	for (var y=0; y<level.length; y++)
	{
		for (var x=0; x<level[y].length; x++)
		{
			var tile = level[y][x];
			//var color = getRandomColor();
			
			
			
			// walls
			if (tile == 1)
			{
				lvl_ctx.beginPath();
				lvl_ctx.rect(x*w, y*h, w, h);
				lvl_ctx.fillStyle = "hsl("+color.h+", "+color.s+"%, "+color.l+"%)";
				lvl_ctx.fill();
				lvl_ctx.lineWidth = 2;
				lvl_ctx.strokeStyle = "hsl("+color.h+", "+color.s+"%, "+(color.l*0.95)+"%)";
				lvl_ctx.stroke();
				lvl_ctx.closePath();
				
				lvl_ctx.lineWidth = 1;
			}
			
			// powerups
			else if (tile == 2)
			{
				lvl_ctx.beginPath();
				lvl_ctx.arc(x*w + 0.5*w, y*h + 0.5*w, 0.24*w, 0, 2*Math.PI);
				lvl_ctx.fillStyle = "hsl("+color.h+", "+(color.s*0.2)+"%, "+(100-(100-color.l)*0.5)+"%)";
				lvl_ctx.fill();
				lvl_ctx.strokeStyle = "hsl("+color.h+", "+(color.s*0.2)+"%, "+(100-(100-color.l)*0.7)+"%)";
				lvl_ctx.stroke();
				lvl_ctx.closePath();
				
				lvl_ctx.beginPath();
				lvl_ctx.arc(x*w + 0.5*w, y*h + 0.5*w, 0.1*w, 0, 2*Math.PI);
				lvl_ctx.fillStyle = "hsl("+((color.h + 60) % 360)+", "+(color.s)+"%, "+(100-(100-color.l)*1)+"%)"; //"#eee";
				lvl_ctx.fill();
				lvl_ctx.strokeStyle = "hsl("+color.h+", "+(color.s*0.2)+"%, "+(100-(100-color.l)*0.7)+"%)";
				//lvl_ctx.stroke();
				lvl_ctx.closePath();
				
				
				//drawPowerup((x+0.5)*w, (y+0.5)*h, w*0.36);
			}
		}
	}
}


// draws tank
function drawTank(tank)
{
	if (tank.health > 0)
	{
		ctx.translate(tank.x*f, tank.y*f);
		ctx.rotate(tank.angle * Math.PI/180);
		
		var w = tank.width*f;
		var h = tank.height*f;
		
		// body
		ctx.beginPath();
		ctx.roundRect(-h/2, -w/2, h, w, w*0.15);
		ctx.fillStyle = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*1)+"%)";
		ctx.fill();
		//ctx.strokeStyle = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*0.9)+"%)";
		//ctx.stroke();
		ctx.closePath();
		
		
		// front lights
		ctx.beginPath();
		ctx.roundRect(h/2 - h*0.1, -w/2 + 0.15*w, h*0.1, w*0.18, {tl: w*0.1, tr: 0, br: 0, bl: w*0.1});
		ctx.roundRect(h/2 - h*0.1, w/2 - 0.15*w - 0.18*w, h*0.1, w*0.18, {tl: w*0.1, tr: 0, br: 0, bl: w*0.1});
		ctx.fillStyle = tank.speed > 0 ? "hsl(48, 89%, 50%)" : "hsl(48, 30%, 50%)";
		ctx.fill();
		ctx.closePath();
		
		// back lights
		ctx.beginPath();
		ctx.roundRect(-h/2, -w/2 + 0.18*w, h*0.06, w*0.18, {tl: 0, tr: w*0.1, br: w*0.1, bl: 0});
		ctx.roundRect(-h/2, w/2 - 0.18*w - 0.18*w, h*0.06, w*0.18, {tl: 0, tr: w*0.1, br: w*0.1, bl: 0});
		ctx.fillStyle = tank.speed == 0 ? "hsl(350, 82%, 61%)" : "hsl(350, 30%, 61%)";
		ctx.fill();
		ctx.closePath();
		
		
		// pipe
		ctx.beginPath();
		ctx.roundRect(h*0.3/2, -w*0.2/2, h*0.45, w*0.2, w*0.05);
		ctx.fillStyle = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*0.7)+"%)";
		ctx.fill();
		ctx.closePath();
		
		// head
		ctx.beginPath();
		ctx.roundRect(-h*0.38, -w*0.7/2, h*0.6, w*0.7, w*0.15);
		ctx.fillStyle = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*0.75)+"%)";
		ctx.fill();
		ctx.closePath();
		
		// details
		ctx.beginPath();
		ctx.arc(-h*0.15, -w*0.07, w*0.16, 0, 2*Math.PI);
		ctx.rect(h*0.02, -w*0.26, h*0.1, w*0.3);
		ctx.rect(-h*0.28, w*0.14, h*0.4, w*0.1);
		ctx.fillStyle = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*0.65)+"%)";
		ctx.fill();
		ctx.closePath();
		
		// hitbox
		// ctx.beginPath();
		// ctx.arc(0, 0, tank.hitbox_r*f, 0, 2*Math.PI);
		// ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
		// ctx.fill();
		// ctx.closePath();
		
		ctx.rotate(-tank.angle * Math.PI/180);
		ctx.translate(-tank.x*f, -tank.y*f);
	}
	else
	{
		var size = tank.width*f * 0.3;
		ctx.beginPath();
		ctx.moveTo(tank.x*f - size, tank.y*f - size);
		ctx.lineTo(tank.x*f + size, tank.y*f + size);
		ctx.moveTo(tank.x*f + size, tank.y*f - size);
		ctx.lineTo(tank.x*f - size, tank.y*f + size);
		ctx.lineWidth = 0.5*f;
		ctx.strokeStyle = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l)+"%)";
		ctx.stroke();
		ctx.closePath();
		
		ctx.lineWidth = 1;
	}
}

function drawBullet(bullet)
{
	var h = 0.8*f;
	var w = 0.3*f;
	
	ctx.translate(bullet.x*f, bullet.y*f);
	ctx.rotate(bullet.angle * Math.PI/180);
	
	// body
	ctx.beginPath();
	ctx.roundRect(-h, -w/2, h, w, {tl: 0, tr: w*0.5, br: w*0.5, bl: 0});
	ctx.fillStyle = "hsl("+bullet.color.h+", "+bullet.color.s+"%, "+(bullet.color.l*0.5)+"%)";
	ctx.fill();
	ctx.closePath();
	
	// detail
	ctx.beginPath();
	ctx.rect(-h, -w/2, h*0.3, w);
	ctx.fillStyle = "hsl("+bullet.color.h+", "+(bullet.color.s*0.95)+"%, "+(bullet.color.l*0.75)+"%)";
	ctx.fill();
	ctx.closePath();
	
	ctx.rotate(-bullet.angle * Math.PI/180);
	ctx.translate(-bullet.x*f, -bullet.y*f);
}

function drawPowerup(powerup)
{
	var x = powerup.x*f,
		y = powerup.y*f,
		r = powerup.size/2*f;
		
	var powerup_color = {
		h: ((color.h + 60) % 360),
		s: (100-(100-color.s)*0.7),
		l: color.l
	};
	
	// base
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2*Math.PI);
	ctx.fillStyle = "hsl("+powerup_color.h+", "+powerup_color.s+"%, "+(powerup_color.l)+"%)";
	ctx.fill();
	ctx.lineWidth = 2;
	ctx.strokeStyle = "hsl("+powerup_color.h+", "+powerup_color.s+"%, "+(100-(100-powerup_color.l)*0.85)+"%)";
	ctx.stroke();
	ctx.closePath();
	
	ctx.lineWidth = 1;
	
	// highlight
	ctx.beginPath();
	ctx.ellipse(x - 0.08*r, y - 0.21*r, 0.9*r, 0.7*r, toRadians(-20), 1*Math.PI, 2*Math.PI);
	ctx.ellipse(x - 0.08*r, y - 0.21*r, 0.9*r, 0.2*r, toRadians(-20), 0*Math.PI, 1*Math.PI);
	ctx.fillStyle = "hsl("+powerup_color.h+", "+powerup_color.s+"%, "+(100-(100-powerup_color.l)*0.85)+"%)";
	ctx.fill();
	ctx.closePath();
	
	// shadow
	ctx.beginPath();
	ctx.ellipse(x + 0.08*r, y + 0.22*r, 0.9*r, 0.7*r, toRadians(160), 1*Math.PI, 2*Math.PI);
	ctx.ellipse(x + 0.08*r, y + 0.22*r, 0.9*r, 0.2*r, toRadians(160), 0*Math.PI, 1*Math.PI);
	ctx.fillStyle = "hsl("+powerup_color.h+", "+powerup_color.s+"%, "+(powerup_color.l*0.92)+"%)";
	ctx.fill();
	ctx.closePath();
	
	// lightning
	var h = Math.sqrt(2*Math.pow(r, 2));
	var w = h * 0.6;
	ctx.beginPath();
	ctx.moveTo(x + w*0.3, y-h*0.5);
	ctx.lineTo(x + w*0.1, y-h*0.1);
	ctx.lineTo(x + w*0.5, y-h*0.1);
	
	ctx.lineTo(x - w*0.3, y+h*0.5);
	ctx.lineTo(x - w*0.1, y+h*0.1);
	ctx.lineTo(x - w*0.5, y+h*0.1);
	ctx.fillStyle = "#fff";
	ctx.fill();
	ctx.closePath();
}

function render()
{
	for (var p in powerups)
	{
		drawPowerup(powerups[p]);
	}
	
	for (var t in tanks)
	{
		drawTank(tanks[t]);
	}
	
	for (var b in bullets)
	{
		drawBullet(bullets[b]);
	}
}

function loop()
{
	clear(canvas);
	render();
	
	requestAnimFrame(loop);
}

function clear(c)
{
	c.getContext("2d").clearRect(0, 0, c.width, c.height);
}
