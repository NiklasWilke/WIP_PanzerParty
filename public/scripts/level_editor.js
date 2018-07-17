
var socket = io();

var editor,
	save_button,
	w, h;
var tiles = [];

var color = {
	h: Math.round(Math.random() * 360),
	s: Math.round(Math.random() * 20 + 30),
	l: Math.round(Math.random() * 20 + 50)
};

var draw = false;

console.log("Color: hsl("+color.h+", "+color.s+"%, "+color.l+"%)");

function drawEditor()
{
	w = parseInt(document.getElementById("width").value);
	h = parseInt(document.getElementById("height").value);
	
	editor.innerHTML = "";
	
	var elem;
	for (var x=0; x<w; x++)
	{
		for (var y=0; y<h; y++)
		{
			elem = document.createElement("div");
			elem.className = "wall";
			elem.addEventListener("mousedown", function(e)
			{
				e.preventDefault();
				if (!this.hasAttribute("block"))
				{
					this.setAttribute("block", e.which == 1 ? 1 : 2);
				}
				else
				{
					this.removeAttribute("block");
				}
			});
			elem.addEventListener("mouseenter", function(e)
			{
				e.preventDefault();
				if (!draw) return false;
				
				if (!this.hasAttribute("block"))
				{
					this.setAttribute("block", e.which == 1 ? 1 : 2);
				}
				else
				{
					this.removeAttribute("block");
				}
			});
			elem.style.width = (100/w)+"vh";
			elem.style.height = (100/h)+"vh";
			if (x == 0 || x == w-1 || y == 0 || y == h-1) elem.setAttribute("block", 1);
			editor.appendChild(elem);
		}
	}
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
		
		var json = exportMap();
		prompt("JSON", json);
	});
}

function exportMap()
{
	var result = [];
	var tiles = document.querySelectorAll("#editor .wall");
	
	for (var y=0; y<h; y++)
	{
		var row = [];
		for (var x=0; x<w; x++)
		{
			row.push(tiles[y*w + x].hasAttribute("block") ? parseInt(tiles[y*w + x].getAttribute("block")) : 0);
		}
		result.push(row);
	}
	
	console.log("RESULT:", JSON.stringify(result));
	return JSON.stringify(result);
}

document.addEventListener("DOMContentLoaded", ini, false);