var socket = io();

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
		s: Math.round(Math.random() * 5 + 40),
		l: Math.round(Math.random() * 10 + 60)
	};
}

function updateHP(hp)
{
	if (hp <= 0)
	{
		document.querySelector("#health .heart:nth-child(1)").setAttribute("empty", "");
		document.querySelector("#health .heart:nth-child(2)").setAttribute("empty", "");
	}
	else if (hp <= 50)
	{
		document.querySelector("#health .heart:nth-child(1)").removeAttribute("empty");
		document.querySelector("#health .heart:nth-child(2)").setAttribute("empty", "");
	}
	else
	{
		document.querySelector("#health .heart:nth-child(1)").removeAttribute("empty");
		document.querySelector("#health .heart:nth-child(2)").removeAttribute("empty");
	}
}

var name, color;
document.addEventListener("DOMContentLoaded", function()
{
	var joystick = document.getElementById("joystick");
	var joystick_button = document.querySelector("#joystick .button");
	var fire_button = document.getElementById("fire");
	var powerup_button = document.getElementById("powerup");
	var respawn_button = document.getElementById("respawn");
	var join_button = document.getElementById("join");
	var name_input = document.querySelector("#login .name")
	
	name_input.value = Cookies.get("name");
	name_input.addEventListener("keyup", function(e)
	{
		if (e.which == 13) join_button.focus();
	});
	
	join_button.addEventListener("click", function(e)
	{
		name = name_input.value;
		color = tank.color;
		
		if (name == "") return false;
		Cookies.set("name", name, Infinity, "/"); // (key, val, end, path, domain, secure)
		
		socket.emit("join", name, color, iniScreen);
	});
	
	socket.on("reconnect", function()
	{
		console.log("reconnected");
		if (name && color) socket.emit("join", name, color, iniScreen);
		document.body.removeAttribute("offline");
	});
	
	socket.on("connect_timeout", function()
	{
		console.log("connect_timeout");
	});
	
	socket.on("disconnect", function()
	{
		console.log("disconnect");
		document.body.setAttribute("offline", true);
	});
	
	var iniScreen = function(tank)
	{
		document.body.className = "ready";
		document.body.style.backgroundColor = "hsl("+tank.color.h+", "+tank.color.s+"%, "+tank.color.l+"%)";
		joystick.style.backgroundColor = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*0.9)+"%)";
		joystick_button.style.backgroundColor = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l)+"%)";

		fire_button.style.backgroundColor = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*0.8)+"%)";
		fire_button.setAttribute("count", 6);

		powerup_button.style.backgroundColor = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*0.8)+"%)";
		
		document.querySelector("#powerup svg").style.stroke = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*0.9)+"%)";
		//document.querySelector("#powerup svg #bar").style.stroke = "hsl("+tank.color.h+", "+tank.color.s+"%, "+(tank.color.l*0.7)+"%)";
	};
	
	
	
	var joystickMovement = function(e)
	{
		e.preventDefault();
		
		var touches = Array.from(e.touches).filter(function(t)
		{
			return t.target.id != "fire";
		});
		
		if (touches.length == 0) return false;
		
		var touch = touches[0];
		var x = (touch.pageX - this.offsetLeft) / this.offsetWidth *2-1;
		var y = (touch.pageY - this.offsetTop) / this.offsetHeight *2-1;
		var angle = toDegrees(Math.atan2(y, x));
		var speed = Math.min(Math.hypot(y, x), 1);
		
		joystick_button.style.top = (20 + Math.sin(toRadians(angle)) * speed * 16) + "vh";
		joystick_button.style.left = (20 + Math.cos(toRadians(angle)) * speed * 16) + "vh";
		
		socket.emit("move", angle, speed);
		
		return false;
	}
	
	joystick.addEventListener("touchstart", joystickMovement);
	joystick.addEventListener("touchmove", joystickMovement);
	joystick.addEventListener("touchend", function(e)
	{
		joystick_button.style.top = "20vh";
		joystick_button.style.left = "20vh";
		
		socket.emit("move", null, null);
	});
	
	
	powerup_button.addEventListener("touchstart", function(e)
	{
		if (!this.disabled)
		{
			socket.emit("activatePowerup");
			if (navigator.vibrate) navigator.vibrate([10]);
		}
	});
	
	
	fire_button.addEventListener("touchstart", function(e)
	{
		if (parseInt(this.getAttribute("count")) > 0)
		{
			socket.emit("shoot");
			if (navigator.vibrate) navigator.vibrate([10]);
		}
	});
	
	
	respawn_button.addEventListener("touchstart", function(e)
	{
		if (this.disabled) return false;
		
		var elem = document.getElementById("dead");
		elem.className = "";
		socket.emit("respawn");
		updateHP(100);
	});
	
	
	/* draw tank */
	var tank = {};
	tank.x = 50;
	tank.y = 50;
	tank.width = 22.5*2.5;
	tank.height = 26.25*2.5;
	tank.angle = 0;
	tank.speed = 1;
	tank.health = 100;
	tank.color = {h: 0, s: 0, l: 100};
	
	window.setInterval(function()
	{
		var tank_preview = document.getElementById("tank_preview").getContext("2d");
		tank_preview.clear();
		tank_preview.drawTank(tank);
		tank.angle = (tank.angle + 0.8) % 360;
	}, 1000/60);
	
	// tank color selection
	document.getElementById("tank_preview").addEventListener("click", function(e)
	{
		document.querySelector("#login .label").className = "label hidden";
		document.querySelector("#login #select_color").className = "";
	});
	var color_inputs = document.querySelectorAll("#login #select_color .color");
	for (var c=0; c<color_inputs.length; c++)
	{
		color_inputs[c].addEventListener("click", function(e)
		{
			var tmp = this.getAttribute("value").split(";");
			tank.color = {h: tmp[0], s: tmp[1], l: tmp[2]};
			document.querySelector("#login #select_color").className = "hidden";
		});
	}
	
	/* socket events */
	socket.on("ping", function(callback)
	{
		callback();
	});
	socket.on("updatePing", function(latency)
	{
		document.getElementById("ping").innerHTML = latency+"ms";
	});
	
	socket.on("updateAvailableColors", function(colors)
	{
		console.log("colors > ", colors);
		var wrapper = document.querySelector("#select_color .wrapper");
		wrapper.innerHTML = "";
		
		if (tank.color.l == 100)
		{
			var available = colors.filter(function(c){return !c.taken;});
			tank.color = available[Math.floor(Math.random()*available.length)];
		}
		
		for (var c in colors)
		{
			var color = colors[c];
			
			var elem = document.createElement("button");
			elem.className = "color";
			elem.disabled = color.taken;
			elem.style.backgroundColor = "hsl("+color.h+", "+color.s+"%, "+color.l+"%)";
			elem.setAttribute("value", color.h+";"+color.s+";"+color.l);
			elem.addEventListener("click", function(e)
			{
				var tmp = this.getAttribute("value").split(";");
				tank.color = {h: tmp[0], s: tmp[1], l: tmp[2]};
				document.querySelector("#login #select_color").className = "hidden";
			});
			
			wrapper.appendChild(elem);
		}
	});

	// game state changed
	socket.on("updateGameState", function(state)
	{
		console.log("updateGameState > ", state);
		
		document.body.setAttribute("state", state);
	});

	socket.on("updateBulletCount", function(count)
	{
		console.log("updateBulletCount >", count);
		fire_button.setAttribute("count", count);
	});

	socket.on("updatePowerup", function(powerup)
	{
		console.log("updatePowerup > ", powerup);
		
		var circle = document.querySelector("#powerup svg #bar");
		var r = circle.getAttributeNS(null, "r");
		var c = Math.PI*(r*2);
		
		if (powerup)
		{
			powerup_button.disabled = false;
			powerup_button.setAttribute("name", powerup.name);
			powerup_button.style.backgroundImage = "url(/powerups/"+powerup.icon+".svg)";
			
			var val = powerup.duration / powerup.total_duration * 100;
			if (val < 0) { val = 0;}
			if (val > 100) { val = 100;}

			var pct = ((100-val)/100)*c * -1;
			circle.style.strokeDashoffset = pct;
		}
		else
		{
			powerup_button.disabled = true;
			powerup_button.removeAttribute("name");
			powerup_button.style.backgroundImage = "none";
			
			var pct = ((100-0)/100)*c * -1;
			circle.style.strokeDashoffset = pct;
		}
	});

	socket.on("hit", function(hp)
	{
		console.log("got hit >> ", hp);
		if (navigator.vibrate) navigator.vibrate([200]);
		updateHP(hp);
	});

	socket.on("death", function(killer)
	{
		updateHP(0);
		var msg = killer ? killer.player.name+" hat dich zerstört!" : "Du hast dich selber zerstört";
		
		var s = 3;
		respawn_button.disabled = true;
		respawn_button.innerHTML = "Respawn in "+s+"s";
		
		var elem = document.getElementById("dead");
		elem.getElementsByClassName("message")[0].innerHTML = msg;
		elem.className = "visible";
		if (navigator.vibrate) navigator.vibrate([600]);
		
		var interval = window.setInterval(function()
		{
			if (--s > 0)
			{
				respawn_button.innerHTML = "Respawn in "+s+"s";
			}
			else
			{
				clearInterval(interval);
				respawn_button.innerHTML = "Respawn!";
				respawn_button.disabled = false;
			}
		}, 1000);
	});
}, false);