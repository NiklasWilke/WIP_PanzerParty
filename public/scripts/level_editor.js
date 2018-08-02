
var socket = io();

var editor,
	save_button,
	s;
var tiles = [];

var color = {
	h: Math.round(Math.random() * 360),
	s: Math.round(Math.random() * 20 + 30),
	l: Math.round(Math.random() * 20 + 50)
};

var draw = false;

console.log("Color: hsl("+color.h+", "+color.s+"%, "+color.l+"%)");

function drawEditor(level)
{
	s = level ? level.size : parseInt(document.getElementById("size").value);
	
	editor.innerHTML = "";
	
	var elem;
	for (var y=0; y<s; y++)
	{
		for (var x=0; x<s; x++)
		{
			elem = document.createElement("div");
			elem.className = "wall";
			elem.addEventListener("mousedown", function(e)
			{
				if (e.which == 1)
				{
					e.preventDefault();
					if (this.getAttribute("block") != 1)
					{
						this.setAttribute("block", 1);
					}
					else
					{
						this.setAttribute("block", 0);
					}
				}
			});
			elem.addEventListener("contextmenu", function(e)
			{
				e.preventDefault();
				if (this.getAttribute("block") != 2)
				{
					this.setAttribute("block", 2);
				}
				else
				{
					this.setAttribute("block", 0);
				}
			});
			elem.addEventListener("mouseenter", function(e)
			{
				e.preventDefault();
				if (!draw) return false;
				
				if (this.getAttribute("block") == 0)
				{
					this.setAttribute("block", e.which == 1 ? 1 : 2);
				}
				else
				{
					this.setAttribute("block", 0);
				}
			});
			elem.style.width = (100/s)+"vh";
			elem.style.height = (100/s)+"vh";
			elem.setAttribute("block", level ? level.tiles[y][x] : ((x == 0 || x == s-1 || y == 0 || y == s-1) ? 1 : 0));
			editor.appendChild(elem);
		}
	}
}

function loadLevel(id)
{
	var tiles = document.querySelectorAll("#editor .wall");
	socket.emit("getLevel", id, function(level)
	{
		console.log("load level > ", level);
		drawEditor(level);
	});
}

function ini()
{
	editor = document.getElementById("editor");
	save_button = document.getElementById("save");
	
	editor.style.color = "hsl("+color.h+", "+color.s+"%, "+color.l+"%)";
	editor.addEventListener("mousedown", function(e)
	{
		e.preventDefault();
		draw = true;
		return false;
	});
	editor.addEventListener("mouseup", function(e)
	{
		draw = false;
	});
	
	document.getElementById("clear").addEventListener("click", function(e)
	{
		drawEditor();
	});
	
	drawEditor();
	
	save_button.addEventListener("click", function(e)
	{
		console.log("save");
		
		var level = exportMap();
		var name = prompt("Name der Map:");
		if (name == "") return alert("Ungültiger Name");
		var file_name = name.toLowerCase().replace(/ +/, "-")+".json";
		
		socket.emit("saveLevel", file_name, name, level, function()
		{
			alert("Erfolgreich gespeichert!");
		});
	});
	
	socket.emit("getLevels", function(levels)
	{
		console.log("setLevels", levels);
		
		var wrapper = document.getElementById("levels");
		wrapper.innerHTML = "";
		for (var l in levels)
		{
			var level = levels[l];
			level.color = color;
			
			var elem = document.createElement("div");
			elem.className = "level";
			elem.style.color = "hsla("+color.h+", "+color.s+"%, "+color.l+"%, 0.1)";
			elem.setAttribute("data-id", level.id);
			elem.addEventListener("click", function(e)
			{
				var id = this.getAttribute("data-id");
				loadLevel(id);
			});
			
			var map = document.createElement("div");
			map.className = "map";
			
			var canvas = document.createElement("canvas");
			canvas.className = "canvas";
			canvas.width = 500;
			canvas.height = 500;
			
			var ctx = canvas.getContext("2d");
			ctx.drawLevel(level);
			
			var name = document.createElement("div");
			name.className = "name valign";
			name.innerHTML = "<span>"+level.name+"</span>";
			
			map.appendChild(canvas);
			elem.appendChild(map);
			elem.appendChild(name);
			wrapper.appendChild(elem);
		}
	});
}

function exportMap()
{
	var result = [];
	var tiles = document.querySelectorAll("#editor .wall");
	
	for (var y=0; y<s; y++)
	{
		var row = [];
		for (var x=0; x<s; x++)
		{
			row.push(tiles[y*s + x].hasAttribute("block") ? parseInt(tiles[y*s + x].getAttribute("block")) : 0);
		}
		result.push(row);
	}
	
	console.log("RESULT:", JSON.stringify(result));
	return result;
}

document.addEventListener("DOMContentLoaded", ini, false);