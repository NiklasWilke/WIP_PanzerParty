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
	map = null,
	beacons = [];


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

// update
socket.on("update", function(data)
{
	tanks = data.tanks;
	bullets = data.bullets;
	powerups = data.powerups;
});

// update
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
	map = m;
	
	lvl_ctx.clear();
	lvl_ctx.drawLevel(map);
	
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
	audio.play();
});
socket.on("bulletBounced", function()
{
	var audio = new Audio("/sounds/bounce.wav");
	audio.volume = 0.3;
	audio.play();
});


// kill feed
socket.on("kill", function(killer, victim)
{
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
	s: 70,
	l: 60
};

function render()
{
	for (var p in powerups)
	{
		powerup_color.h = (powerup_color.h + 0.1) % 360,
		powerups[p].color = powerup_color;
		
		ctx.drawPowerup(powerups[p]);
	}
	
	for (var t in tanks)
	{
		ctx.drawTank(tanks[t]);
	}
	
	for (var b in bullets)
	{
		ctx.drawBullet(bullets[b]);
	}
	
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
	for (var b in beacons)
	{
		ctx.drawBeacon(beacons[b]);
	}
}

function loop()
{
	ctx.clear();
	render();
	
	requestAnimFrame(loop);
}