// generates random color
function getRandomColor()
{
	return {
		h: Math.round(Math.random() * 360),
		s: Math.round(Math.random() * 5 + 40),
		l: Math.round(Math.random() * 10 + 60)
	};
}

class Particle
{
	constructor(x, y, dir, range, color)
	{
		this.x = x;
		this.y = y;
		this.angle = dir;
		this.speed = 0.08 + Math.random() * 0.04;
		this.r = (Math.random() * (range/4*0.5) + (range/4*0.6)) / 2;
		this.dist = 0;
		this.max_dist = range;
		this.color = color;
		this.color.l += Math.round(5 - Math.random() * 10);
		this.opacity = 1;
		
		this.x += Math.cos(toRadians(this.angle)) * 0.05;
		this.y += Math.sin(toRadians(this.angle)) * 0.05;
	}
	
	update()
	{
		this.x += Math.cos(toRadians(this.angle)) * this.speed;
		this.y += Math.sin(toRadians(this.angle)) * this.speed;
		this.dist += this.speed;
		this.opacity = Math.min(1, 2 - (this.dist / this.max_dist * 2));
	}
}

class Explosion
{
	constructor(x, y, size, n, color)
	{
		this.x = x;
		this.y = y;
		this.r = 0;
		this.max_r = size;
		this.step = this.max_r / (60*0.5);
		if (color.l > 70) color.l *= 0.8;
		this.color = color;
		this.particles = [];
		this.done = false;
		
		var tolerance = 10;
		for (var i=0; i<n; i++)
		{
			this.particles.push(new Particle(0, 0, (i/(n+1) * 360 + (tolerance/2 - tolerance/2*Math.random())), this.max_r, this.color));
		}
	}
	
	update()
	{
		this.done = true;
		for (var p in this.particles)
		{
			this.particles[p].update();
			this.done = (this.done && this.particles[p].dist >= this.max_r);
		}
	}
}


var socket = io();

//canvas 
var canvas,
	ctx,
	lvl_canvas,
	lvl_ctx,
	effect_canvas,
	effect_ctx,
	f;

// map objects
var tanks = [],
	bullets = [],
	powerups = [],
	gravestones = [],
	map = null,
	beacons = [],
	explosions = [];


// map calor
var color = getRandomColor();

console.log("Color: hsl("+color.h+", "+color.s+"%, "+color.l+"%)");


function ini()
{
	/* menu */
	var menu_buttons = document.querySelectorAll("#menu li span");
	for (var i=0; i<menu_buttons.length; i++)
	{
		menu_buttons[i].addEventListener("click", function(e)
		{
			var action = this.getAttribute("action");
			console.log("MENU:"+action);
			switch (action)
			{
				case "continue":
					document.getElementById("menu").className = "valign hidden";
					break;
				case "stop":
					socket.emit("stopGame", function()
					{
						window.location = "/";
					});
					break;
			}
		});
	}
	
	var menu_icon = document.getElementById("menu_icon");
	menu_icon.addEventListener("click", function(e)
	{
		document.getElementById("menu").className = "valign";
	});
	
	canvas = document.getElementById("objects");
	lvl_canvas = document.getElementById("level");
	effect_canvas = document.getElementById("effects");
	
	ctx = canvas.getContext("2d");
	lvl_ctx = lvl_canvas.getContext("2d");
	effect_ctx = effect_canvas.getContext("2d");
	
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
	
	effect_canvas.width = window.innerHeight;
	effect_canvas.height = window.innerHeight;
	
	lvl_ctx.clear();
	lvl_ctx.drawLevel(map);
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

// game state changed
socket.on("updateGameState", function(state)
{
	console.log("updateGameState > ", state);
	
	document.body.setAttribute("state", state);
});

// update battleground
socket.on("update", function(data)
{
	//console.log("update >> ", data);
	tanks = data.tanks;
	bullets = data.bullets;
	powerups = data.powerups;
	gravestones = data.graveyard;
});

// update scoreboard
socket.on("updateScoreboard", function(players)
{
	console.log("updateScoreboard > ", players);
	
	var scoreboard = document.querySelector("#scoreboard tbody");
	scoreboard.innerHTML = "";
	
	for (var p in players)
	{
		var player = players[p];
		var tr = document.createElement("tr");
		tr.style.color = "hsl("+player.color.h+", "+player.color.s+"%, "+player.color.l+"%)";
		var kd = (Math.floor(player.kd))+"."+((Math.round((player.kd % 1) * 100) / 100)+"0000").slice(2, 4);
		tr.innerHTML = "<td>"+player.name+"</td><td>"+player.kills+"</td><td>"+player.deaths+"</td><td>"+kd+"</td>";
		scoreboard.appendChild(tr);
	}
});


var map_color = getRandomColor();


// render map
socket.on("setLevels", function(levels)
{
	console.log("setLevels", levels);
	
	var wrapper = document.getElementById("levels");
	wrapper.innerHTML = "";
	for (var l in levels)
	{
		var level = levels[l];
		level.color = map_color;
		
		var elem = document.createElement("div");
		elem.className = "level";
		elem.setAttribute("data-id", level.id);
		
		var map = document.createElement("div");
		map.className = "map";
		map.addEventListener("click", function(e)
		{
			var id = this.parentNode.getAttribute("data-id");
			socket.emit("selectLevel", id);
		});
		
		var canvas = document.createElement("canvas");
		canvas.className = "canvas";
		canvas.width = 500;
		canvas.height = 500;
		
		var ctx = canvas.getContext("2d");
		ctx.drawLevel(level);
		
		var name = document.createElement("div");
		name.className = "name";
		name.innerHTML = level.name;
		
		map.appendChild(canvas);
		elem.appendChild(map);
		elem.appendChild(name);
		wrapper.appendChild(elem);
	}
	document.getElementById("select_level").className = "";
});


// render map
socket.on("renderMap", function(m)
{
	console.log("renderMap > ", m);
	document.getElementById("select_level").className = "hidden";
	document.getElementById("battleground").style.borderColor = "hsl("+map_color.h+", "+map_color.s+"%, "+(map_color.l*0.7)+"%)";
	document.getElementById("battleground").style.background = "hsl("+map_color.h+", "+map_color.s+"%, "+(map_color.l)+"%)";
	document.getElementById("level").style.background = "hsla("+map_color.h+", "+map_color.s+"%, "+(100-(100-map_color.l)*0.1)+"%)";
	
	m.color = map_color;
	m.level.color = map_color;
	map = m;
	
	lvl_ctx.clear();
	lvl_ctx.drawLevel(map.level);
	
	for (var p in map.powerups)
	{
		ctx.drawPowerup(map.powerups[p]);
	}
});


// powerup activated
socket.on("powerupActivated", function(tank, powerup)
{
	if (powerup.type == "emp")
	{
		var max_r = Math.sqrt(Math.pow((tank.x > 50 ? tank.x : 100-tank.x), 2) + Math.pow((tank.y > 50 ? tank.y : 100-tank.y), 2));
		beacons.push({
			x: tank.x,
			y: tank.y,
			r: 0,
			max_r: max_r * 1.2,
			step: max_r / (60*0.8),
			color: powerup.color
		});
	}
});


// sounds
socket.on("shotFired", function()
{
	var audio = new Audio("/sounds/shoot.wav");
	audio.volume = 0.8;
	audio.play();
});
socket.on("bulletBounced", function(bullet)
{
	var audio = new Audio("/sounds/bounce.wav");
	audio.volume = 0.3;
	audio.play();
	
	var expl = new Explosion(bullet.x, bullet.y, 1, 10, bullet.color);
	explosions.push(expl);
});
socket.on("bulletDespawned", function(bullet)
{
	var expl = new Explosion(bullet.x, bullet.y, 2, 10, bullet.color);
	explosions.push(expl);
});
socket.on("kill", function(killer, victim)
{
	var audio = new Audio("/sounds/party_horn.wav");
	audio.volume = 0.4;
	audio.play();
	
	console.log(killer, victim);
	
	var expl = new Explosion(victim.x, victim.y, 4, 24, victim.color);
	explosions.push(expl);
});


// kill feed
socket.on("kill", function(killer, victim)
{
	if (killer) killer = killer.player;
	if (victim) victim = victim.player;
	
	console.log(killer, " > ", victim);
	
	var kill_log = document.getElementById("kill_log");
	
	var elem = document.createElement("li");
	if (killer.id != victim.id)
	{
		elem.innerHTML = "<span style='color:hsl("+killer.color.h+", "+killer.color.s+"%, "+killer.color.l+"%)'>"+killer.name+"</span><img src='/icons/killed.svg'><span style='color:hsl("+victim.color.h+", "+victim.color.s+"%, "+victim.color.l+"%)'>"+victim.name+"</span>";
	}
	else
	{
		elem.className = "suicide";
		elem.innerHTML = "<span style='color:hsl("+victim.color.h+", "+victim.color.s+"%, "+victim.color.l+"%)'>"+victim.name+"</span><img src='/icons/skull.svg'>";
	}
	kill_log.prepend(elem);
	
	// window.setTimeout(function()
	// {
		// elem.className = "hide";
		// window.setTimeout(function()
		// {
			// kill_log.removeChild(elem);
		// }, 400);
	// }, 3500);
});


var powerup_color = {
	h: 0,
	s: 60,
	l: 45
};

function update()
{
	for (var b in beacons)
	{
		if (beacons[b].r < beacons[b].max_r)
		{
			beacons[b].r += beacons[b].step;
		}
		else
		{
			beacons.splice(b, 1);
		}
	}
	
	for (var e in explosions)
	{
		if (!explosions[e].done)
		{
			explosions[e].update();
		}
		else
		{
			console.log(explosions[e], "ended");
			explosions.splice(e, 1);
		}
	}
}

function render()
{
	for (var p in powerups)
	{
		powerup_color.h = (powerup_color.h + 0.1) % 360,
		powerups[p].color = powerup_color;
		
		ctx.drawPowerup(powerups[p]);
	}
	
	for (var g in gravestones)
	{
		ctx.drawGravestone(gravestones[g]);
	}
	
	for (var t in tanks)
	{
		ctx.drawTank(tanks[t]);
	}
	
	for (var b in bullets)
	{
		ctx.drawBullet(bullets[b]);
	}
	
	for (var e in explosions)
	{
		effect_ctx.drawExplosion(explosions[e]);
	}
	
	for (var b in beacons)
	{
		effect_ctx.drawBeacon(beacons[b]);
	}
}

var stop = false;
function loop()
{
	ctx.clear();
	effect_ctx.clear();
	
	update();
	
	render();
	
	if (!stop) requestAnimFrame(loop);
}