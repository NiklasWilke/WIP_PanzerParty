function shuffle(arr)
{
    for (let i = arr.length - 1; i > 0; i--)
	{
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}


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
		color.l *= 0.9;
		color.s *= 1.2;
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

var music_volume = Cookies.has("music_volume") ? Cookies.get("music_volume") : 0.4,
	game_volume = Cookies.has("game_volume") ? Cookies.get("game_volume") : 1;

//canvas
var canvas,
	ctx,
	lvl_canvas,
	lvl_ctx,
	powerups_canvas,
	powerups_ctx,
	effect_canvas,
	effect_ctx,
	f;

// map objects
var tanks = [],
	bots = [],
	bullets = [],
	powerups = [],
	gravestones = [],
	map = null,
	beacons = [],
	explosions = [],
	engine_sounds = {};


// map calor
var color = getRandomColor();

console.log("Color: hsl("+color.h+", "+color.s+"%, "+color.l+"%)");


function requestFullscreen(elem)
{
	elem.setAttribute("fullscreen", true);
	if (elem.requestFullscreen) {
		elem.requestFullscreen();
	} else if (elem.mozRequestFullScreen) { /* Firefox */
		elem.mozRequestFullScreen();
	} else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
		elem.webkitRequestFullscreen();
	} else if (elem.msRequestFullscreen) { /* IE/Edge */
		elem.msRequestFullscreen();
	}
}

function ini()
{
	document.getElementById("music").volume = music_volume;

	if (music_volume == 0) document.getElementById("mute_music").className = "muted";
	if (game_volume == 0) document.getElementById("mute_sound").className = "muted";

	/* main menu */
	var main_menu_buttons = document.querySelectorAll("#main_menu li span");
	for (var i=0; i<main_menu_buttons.length; i++)
	{
		main_menu_buttons[i].addEventListener("click", function(e)
		{
			var action = this.getAttribute("action");
			console.log("MENU:"+action);
			switch (action)
			{
				case "lobby_setup":
					document.getElementById("lobby_setup").className = "";
					document.getElementById("main_menu").className = "hidden";
					break;
				case "stop":
					socket.emit("stopServer", function()
					{
						window.close();
					});
					break;
			}
		});
	}

	// menu
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

	document.querySelector("#lobby_setup .level").addEventListener("click", function(e)
	{
		document.querySelector("#lobby_setup #levels").className = "";
	});

	document.getElementById("start_game").addEventListener("click", function(e)
	{
		var id = document.querySelector("#lobby_setup .level").getAttribute("data-id");
		socket.emit("selectLevel", id);
	});

	var menu_icon = document.getElementById("menu_icon");
	menu_icon.addEventListener("click", function(e)
	{
		document.getElementById("menu").className = "valign";
	});

	document.getElementById("mute_music").addEventListener("click", function(e)
	{
		var audio = document.getElementById("music");
		audio.volume = audio.volume == 0 ? 0.4 : 0;
		this.className = audio.volume == 0 ? "muted" : "";

		Cookies.set("music_volume", audio.volume, Infinity, "/");
	});

	document.getElementById("mute_sound").addEventListener("click", function(e)
	{
		game_volume = game_volume == 0 ? 1 : 0;
		this.className = game_volume == 0 ? "muted" : "";

		Cookies.set("game_volume", game_volume, Infinity, "/");
	});

	document.getElementById("fullscreen").addEventListener("click", function(e)
	{
		var elem = document.body;
		elem.setAttribute("fullscreen", true);
		requestFullscreen(elem);

		// weird fullscreen/vh fix
		document.getElementById("sidebar").style.paddingRight = "0";
		setTimeout(function()
		{
			document.getElementById("sidebar").style.paddingRight = "1.9vh";
		}, 100);
	});

	canvas = document.getElementById("objects");
	lvl_canvas = document.getElementById("level");
	powerups_canvas = document.getElementById("powerups");
	effect_canvas = document.getElementById("effects");

	ctx = canvas.getContext("2d");
	lvl_ctx = lvl_canvas.getContext("2d");
	powerups_ctx = powerups_canvas.getContext("2d");
	effect_ctx = effect_canvas.getContext("2d");

	updateSize();
	loop();
}

document.addEventListener("DOMContentLoaded", ini, false);

// responsive canvas
function updateSize()
{
	var w = document.getElementById("battleground").offsetWidth,
		h = document.getElementById("battleground").offsetHeight;

	f = h / 100;

	canvas.width = w;
	canvas.height = h;

	powerups_canvas.width = w;
	powerups_canvas.height = h;

	lvl_canvas.width = w;
	lvl_canvas.height = h;

	effect_canvas.width = w;
	effect_canvas.height = h;

	lvl_ctx.clear();
	if (map)
	{
		lvl_ctx.drawLevel(map.level);

		powerups_ctx.clear();
		for (var p in map.powerups)
		{
			powerups_ctx.drawPowerup(map.powerups[p]);
		}
	}
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

-socket.on("gameReady", function()
{
	var countdown = 3;
	var timer = window.setInterval(function()
	{
		if (countdown == 0)
		{
			clearInterval(timer);

			playSound("/sounds/party_horn.wav", 0.4);
			showMessage("Party!", 800);

			socket.emit("startGame");
		}
		else
		{
			playSound("/sounds/beep.mp3", 0.4);
			showMessage(countdown--, 800);
		}
	}, 1000);
});
socket.on("gameStarted", function()
{
	console.log("game started");
	playSound("/sounds/party_horn.wav", 0.4);
});
socket.on("gameEnded", function(scoreboard)
{
	console.log("game ended");
	playSound("/sounds/party_horn.wav", 0.4);

	showMessage(scoreboard[0].name+" hat gewonnen!");
});

// update timer
socket.on("updateTimer", function(t)
{
	var elem = document.querySelector("#timer span");
	elem.setAttribute("data-secs", t);
	elem.innerHTML = ("00"+Math.floor(t / 60)).slice(-2) + ":" + ("00"+(t % 60)).slice(-2);
});

// update battleground
socket.on("update", function(data)
{
	//console.log("update >> ", data);
	tanks = data.tanks;
	bots = data.bots;
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

	for (var p = 0; p < players.length; p++)
	{
		var player = players[p];
		var tr = document.createElement("tr");
		tr.style.color = "hsl("+player.color.h+", "+player.color.s+"%, "+player.color.l+"%)";
		var kd = (Math.floor(player.kd))+"."+((Math.round((player.kd % 1) * 100) / 100)+"0000").slice(2, 4);
		tr.innerHTML = "<td>"+(p+1)+".</td><td>"+player.name+"</td><td>"+player.kills+"</td><td>"+player.deaths+"</td><td>"+kd+"</td>";
		scoreboard.appendChild(tr);
	}
});

// update scoreboard
socket.on("updatePlayers", function(players)
{
	//console.log("updatePlayers > ", players);

	var player_list = document.querySelector("#player_list");
	player_list.innerHTML = "";

	for (var p = 0; p < players.length; p++)
	{
		var player = players[p];
		var tank = {};
		tank.x = 50;
		tank.y = 50;
		tank.width = 22.5*2.5;
		tank.height = 26.25*2.5;
		tank.angle = -90;
		tank.speed = 1;
		tank.health = 100;
		tank.color = player.color;

		var row = document.createElement("div");
		row.className = "player";
		row.style.color = "hsl("+player.color.h+", "+player.color.s+"%, "+player.color.l+"%)";

		var canvas = document.createElement("canvas");
		canvas.width = 100;
		canvas.height = 100;
		canvas.getContext("2d").drawTank(tank);

		var name = document.createElement("div");
		name.className = "name";
		name.innerHTML = player.name;

		var ping = document.createElement("div");
		ping.className = "ping";
		ping.innerHTML = player.ping+"ms";

		row.append(canvas);
		row.append(name);
		row.append(ping);

		player_list.appendChild(row);
	}
});


var map_color = getRandomColor();


// render map
socket.on("setLevels", function(levels)
{
	console.log("setLevels", levels);

	// select 6 random levels
	levels = shuffle(levels);
	levels = levels.slice(0, Math.min(6, levels.length));


	var level = levels[0];
	document.querySelector("#lobby_setup .level").setAttribute("data-id", level.id);
	document.querySelector("#lobby_setup .level .name").innerHTML = level.name;
	document.querySelector("#lobby_setup .level .name").style.color = "hsl("+level.color.h+", "+level.color.s+"%, "+(level.color.l*0.7)+"%)";
	document.querySelector("#lobby_setup .level .preview").getContext("2d").setSize(500 / level.height * level.width, 500).drawLevel(level);
	document.querySelector("#lobby_setup .level .preview").style.borderColor = "hsl("+level.color.h+", "+level.color.s+"%, "+(level.color.l*0.7)+"%)";


	// add levels to level selection
	var wrapper = document.getElementById("levels");
	wrapper.innerHTML = "";
	for (var l=0; l<levels.length; l++)
	{
		var level = levels[l];

		var elem = document.createElement("div");
		elem.className = "level";
		elem.setAttribute("data-id", level.id);

		var map = document.createElement("div");
		map.className = "map";
		map.level = level;
		map.addEventListener("click", function(e)
		{
			var level = this.level;
			document.querySelector("#lobby_setup .level").setAttribute("data-id", level.id);
			document.querySelector("#lobby_setup .level .name").innerHTML = level.name;
			document.querySelector("#lobby_setup .level .name").style.color = "hsl("+level.color.h+", "+level.color.s+"%, "+(level.color.l*0.7)+"%)";
			document.querySelector("#lobby_setup .level .preview").getContext("2d").setSize(500 / level.height * level.width, 500).drawLevel(level);
			document.querySelector("#lobby_setup .level .preview").style.borderColor = "hsl("+level.color.h+", "+level.color.s+"%, "+(level.color.l*0.7)+"%)";

			document.querySelector("#lobby_setup #levels").className = "hidden";
		});

		var canvas = document.createElement("canvas");
		canvas.className = "canvas";
		canvas.width = 500 / level.height * level.width;
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
});


// render map
socket.on("renderMap", function(m)
{
	var map_color = m.level.color;

	var color_main = "hsl("+map_color.h+", "+map_color.s+"%, "+(map_color.l)+"%)",
		color_background = "hsl("+map_color.h+", "+map_color.s+"%, "+97+"%)",
		color_background_darker = "hsl("+map_color.h+", "+map_color.s+"%, "+90+"%)",
		color_border = "hsl("+map_color.h+", "+map_color.s+"%, "+(map_color.l*0.7)+"%)";

	console.log("renderMap > ", m);
	document.getElementById("battleground").style.height = 95 + "vh";
	document.getElementById("battleground").style.width = (95 / m.height * m.width) + "vh";
	document.getElementById("battleground").style.margin = "2.5vh 0";
	document.getElementById("battleground").style.color = color_main;

	document.getElementById("level").style.background = color_background;

	document.getElementById("scoreboard").style.background = color_background;
	document.getElementById("scoreboard").style.borderColor = color_border;

	document.querySelector("#timer span").style.background = color_background;
	document.querySelector("#timer span").style.borderColor = color_border;
	document.querySelector("#timer span").style.color = color_border;

	//document.getElementById("qr").style.background = color_background;
	document.getElementById("qr").style.borderColor = color_border;

	document.querySelector("#banner > .main .banner").style.stroke = color_border;
	document.querySelector("#banner > .main .banner").style.fill = color_background;
	document.querySelector("#banner > .background .banner").style.stroke = color_border;
	document.querySelector("#banner > .background .banner").style.fill = color_background;

	//document.querySelector("h1").style.color = color_border;

	document.getElementById("game").style.background = color_main;
	document.getElementById("game").style.borderColor = color_border;

	map = m;

	var vh = window.innerHeight;

	lvl_ctx.setSize(m.width/m.height*vh, vh);
	ctx.setSize(m.width/m.height*vh, vh);
	powerups_ctx.setSize(m.width/m.height*vh, vh);
	effect_ctx.setSize(m.width/m.height*vh, vh);

	lvl_ctx.clear();
	lvl_ctx.drawLevel(map.level);

	powerups_ctx.clear();
	for (var p in map.powerups)
	{
		powerups_ctx.drawPowerup(map.powerups[p]);
	}
});


socket.on("updatePowerups", function(powerups)
{
	console.log("updatePowerups > ", powerups);
	powerups_ctx.clear();
	for (var p in powerups)
	{
		powerups_ctx.drawPowerup(powerups[p]);
	}
});

// powerup activated
socket.on("powerupActivated", function(tank, powerup)
{
	if (powerup.animation == "emp")
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

var text_overlay_timout = null;
function showMessage(message, duration)
{
	window.clearInterval(text_overlay_timout);

	var elem = document.getElementById("text_overlay");
	if (elem) elem.parentNode.removeChild(elem);

	// <svg height="30" width="200">
	// 		<text x="0" y="15" fill="red">I love SVG!</text>
	// </svg>

	elem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	elem.id = "text_overlay";

	var inner = document.createElementNS("http://www.w3.org/2000/svg", "text");
	inner.setAttributeNS(null, "class", "main");
	inner.setAttributeNS(null, "alignment-baseline", "middle");
	inner.setAttributeNS(null, "y", "0.6em");
	inner.setAttributeNS(null, "x", "50%");
	inner.setAttributeNS(null, "text-anchor", "middle");
	inner.appendChild(document.createTextNode(message));

	var s1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
	s1.setAttributeNS(null, "class", "s1");
	s1.setAttributeNS(null, "alignment-baseline", "middle");
	s1.setAttributeNS(null, "y", "0.6em");
	s1.setAttributeNS(null, "x", "50%");
	s1.setAttributeNS(null, "text-anchor", "middle");
	s1.appendChild(document.createTextNode(message));

	var s2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
	s2.setAttributeNS(null, "class", "s2");
	s2.setAttributeNS(null, "alignment-baseline", "middle");
	s2.setAttributeNS(null, "y", "0.6em");
	s2.setAttributeNS(null, "x", "50%");
	s2.setAttributeNS(null, "text-anchor", "middle");
	s2.appendChild(document.createTextNode(message));


	elem.appendChild(s1);
	elem.appendChild(s2);
	elem.appendChild(inner);

	document.getElementById("battleground").appendChild(elem);
	if (duration)
	{
		text_overlay_timout = window.setTimeout(function()
		{
			elem.parentNode.removeChild(elem);
		}, duration);
	}
}

function playSound(src, volume)
{
	var audio = new Audio(src);
	audio.volume = volume * game_volume;
	audio.play();
}

// sounds
socket.on("shotFired", function()
{
	playSound("/sounds/shoot.wav", 0.4);
});

//https://audiograb.com/uv8lz7ekg
socket.on("botRotated", function()
{
	playSound("/sounds/rotate.mp3", 0.6);
});
socket.on("bulletBounced", function(bullet)
{
	playSound("/sounds/bounce.wav", 0.05);

	var expl = new Explosion(bullet.x, bullet.y, 1, 10, bullet.color);
	explosions.push(expl);
});
socket.on("bulletDespawned", function(bullet)
{
	playSound("/sounds/bounce.wav", 0.3);

	var expl = new Explosion(bullet.x, bullet.y, 2, 10, bullet.color);
	explosions.push(expl);
});
socket.on("kill", function(killer, victim)
{
	playSound("/sounds/party_horn.wav", 0.4);

	console.log(killer, victim);

	var expl = new Explosion(victim.x, victim.y, 4, 24, victim.color);
	explosions.push(expl);

	lvl_ctx.drawGravestone(victim);
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
	elem.className += " hide";
	kill_log.prepend(elem);


	window.setTimeout(function()
	{
		elem.className = elem.className.replace(" hide", "");
		window.setTimeout(function()
		{
			elem.className = elem.className+" hide";
			window.setTimeout(function()
			{
				kill_log.removeChild(elem);
			}, 400);
		}, 5000);
	}, 10);
});


var powerup_color = {
	h: 0,
	s: 50,
	l: 55
};

var time = Date.now();
function update()
{
  time = Date.now();

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

	for (var e = 0; e < explosions.length; e++)
	{
		if (!explosions[e].done)
		{
			explosions[e].update();
		}
		else
		{
			explosions.splice(e, 1);
		}
	}
}

var powerup_fade_step = 0,
	powerup_fade_dir = 1;
function render()
{
	for (var t in tanks)
	{
		var tank = tanks[t];
		ctx.drawTank(tank);

		if (!engine_sounds[tank.id])
		{
			var audio = new Audio("/sounds/engine.wav");
			audio.loop = true;
			audio.volume = 0;
			audio.play();

			engine_sounds[tank.id] = audio;
		}
		engine_sounds[tank.id].volume = tank.speed * 0.01 * game_volume;
	}

	var temp = tanks.map(function(t){return t.id});
	for (var e in engine_sounds)
	{
		if (temp.indexOf(e) == -1)
		{
			engine_sounds[e].pause();
			delete engine_sounds[e];
		}
	}

	for (var b in bots)
	{
		var bot = bots[b];
		ctx.drawBot(bot);
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
