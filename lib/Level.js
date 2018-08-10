const crypto = require("crypto");

Array.min = function(array)
{
	return Math.min.apply(Math, array);
};
Array.max = function(array)
{
	return Math.max.apply(Math, array);
};

function isJSON(str)
{
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
function toDegrees(angle)
{
	return angle * (180 / Math.PI);
}
function toRadians(angle)
{
	return angle * (Math.PI / 180);
}

class Level
{
	constructor(file)
	{
		var level = require(file);
		var self = this;
		
		
		this.id = crypto.createHash("md5").update(file).digest("hex");
		
		this.file = file;
		this.name = level.name;
		this.color = level.color ? level.color : {h: Math.round(Math.random() * 360), s: Math.round(Math.random() * 5 + 40), l: Math.round(Math.random() * 10 + 60)};
		this.tiles = level.tiles;
		this.width = this.tiles[0].length;
		this.height = this.tiles.length;
		this.tile_size = 100 / this.height;
		
		
		
		console.log("loading level "+level.name+" ["+this.id+"] ("+this.width+"x"+this.height+")");
		
		this.powerups = [];
		this.powerup_locations = [];
		for (var y=0; y<this.tiles.length; y++)
		{
			for (var x=0; x<this.tiles[y].length; x++)
			{
				if (this.tiles[y][x] == 2) this.powerup_locations.push({x: (x+0.5)*this.tile_size, y: (y+0.5)*this.tile_size});
			}
		}
		
		this.shapes = [];
		
		// find wall shapes
		var walls = [];
		var tiles = this.tiles;
		for (var y=0; y<tiles.length; y++)
		{
			for (var x=0; x<tiles[y].length; x++)
			{
				var tile = tiles[y][x];
				
				if (tile == 1)
				{
					walls.push(x+";"+y);
				}
			}
		}
		
		var shapes = this.getShapes(walls);
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
			
		
			// get holes in path
			var empty_blocks = [];
			
			var y_range = tiles.slice(0).map(function(t){return t.y});
			var min_y = Array.min(y_range);
			var max_y = Array.max(y_range);
			
			var x_range = tiles.slice(0).map(function(t){return t.x});
			var min_x = Array.min(x_range);
			var max_x = Array.max(x_range);
			
			//console.log("shape #"+s+" ["+tiles.length+"] "+min_x+","+min_y+" to "+max_x+","+max_y);
			for (var y=min_y; y<=max_y; y++)
			{
				var row = tiles.filter(function(t)
				{
					return (t.y == y);
				});
				row.sort(function(a, b)
				{
					return a.x < b.x ? 1 : -1
				});
				
				var x_range = row.slice(0).map(function(t){return t.x});
				var min_x = Array.min(x_range);
				var max_x = Array.max(x_range);
				
				//console.log("checking Y"+y, row, " > X ", min_x+" to "+max_x);
				for (var x=min_x; x<=max_x; x++)
				{
					//console.log("checking ", x, y);
					
					if (shape.indexOf(x+";"+y) === -1)
					{
						var column = tiles.filter(function(t)
						{
							return (t.x == x);
						}).map(function(t){return t.y});
						
						if (Array.min(column) < y && Array.max(column) > y)
						{
							empty_blocks.push(x+";"+y);
						}
					}
				}
			}
			
			// calculate shape path
			var path = this.shapeToPath(shape);
			//console.log("path >> ", path);
			var empty_spaces = this.getShapes(empty_blocks);
			empty_spaces = empty_spaces.map(function(s)
			{
				return self.shapeToPath(s);
			});
			
			this.shapes.push({tiles: tiles, path: path, cutouts: empty_spaces});
		}
	}
	
	getTile(x, y)
	{
		if (x < this.width && y < this.height)
		{
			return {
				x: x,
				y: y,
				x_abs: x*this.tile_size,
				y_abs: y*this.tile_size,
				size: this.tile_size,
				type: this.tiles[y][x]
			};
		}
		else
		{
			return null;
		}
	}
	
	getTileAtPos(x, y)
	{
		var x = Math.floor(x / this.tile_size);
		var y = Math.floor(y / this.tile_size);
		
		return this.getTile(x, y);
	}
	
	// helper to get shapes
	getShapes(blocks)
	{
		var checked = [];
		var shapes = [];
		var check = function(x, y)
		{
			var p = x+";"+y;
			//console.log("cheking "+p+"...");
			
			if (blocks.indexOf(p) === -1) return [];
			if (checked.indexOf(p) !== -1) return [];
			checked.push(p);
			
			var result = [p].concat(
				check(x, y-1),
				check(x, y+1),
				check(x-1, y),
				check(x+1, y)
			);
			
			return result;
		}
		for (var b in blocks)
		{
			var block = blocks[b].split(";");
			var res = check(parseInt(block[0]), parseInt(block[1]));
			if (res.length > 0)
			{
				shapes.push(res);
			}
		}
		return shapes;
	}

	// helper to parse a shape into a path
	// shapeToPath(shape)
	// {
		// var tiles = shape.slice(0).map(function(t)
		// {
			// t = t.split(";");
			// return {x: parseInt(t[0]), y: parseInt(t[1])};
		// });
		// tiles.sort(function(a,b)
		// {
			// if (a.y > b.y)
				// return 1;
			// if (a.y < b.y)
				// return -1;
			// else
				// return (a.x > b.x) ? 1 : -1;
		// });
		
		// // single block?
		// if (tiles.length == 1)
		// {
			// var tile = tiles[0];
			// return [
				// {x: tile.x, y: tile.y},
				// {x: tile.x+1, y: tile.y},
				// {x: tile.x+1, y: tile.y+1},
				// {x: tile.x, y: tile.y+1},
				// {x: tile.x, y: tile.y}
			// ];
		// }
		
		// var start = tiles[0];
		// var helper = function(shape, pos, dir, path)
		// {
			// if (typeof path == "undefined") path = [pos];
			
			// console.log(pos, "->"+dir, [path.length]);
			
			// if (pos.x == start.x && pos.y == start.y && dir == 0 && path.length > 1)
			// {
				// path.push(start);
				// console.log("> done");
				// return path;
			// }
			
			// var current = path.length > 0 ? path[path.length-1] : pos;
			
			// pos = {
				// x: pos.x + Math.round(Math.cos(toRadians(dir))),
				// y: pos.y + Math.round(Math.sin(toRadians(dir)))
			// };
			
			
			// if (shape.indexOf(pos.x+";"+pos.y) !== -1)
			// {
				// console.log("> look around ("+pos.x+";"+pos.y+")");
				// for (var i=0; i<4; i++)
				// {
					// var angle = ((dir-90) + 90*i) % 360;
					
					// var _path = helper(shape, pos, angle, path);
					// if (_path) return _path;
				
					// path.push({
						// x: current.x + Math.round(Math.cos(toRadians(angle+90))),
						// y: current.y + Math.round(Math.sin(toRadians(angle+90)))
					// });
					// current = path[path.length-1];
				// }
				
				// return false;
			// }
			// else
			// {
				// return false;
			// }
		// }
		
		// var path = helper(shape, start, 0);
		// return path ? path.map(function(p){p.x+=1;return p;}) : path;
	// }
	
	shapeToPath(shape)
	{
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
		
		// single block?
		if (tiles.length == 1)
		{
			var tile = tiles[0];
			return [
				{x: tile.x, y: tile.y},
				{x: tile.x+1, y: tile.y},
				{x: tile.x+1, y: tile.y+1},
				{x: tile.x, y: tile.y+1},
				{x: tile.x, y: tile.y}
			];
		}
		
		var start = tiles[0];
		var helper = function(shape, pos, dir, path)
		{
			if (typeof path == "undefined") path = [pos];
			var current = path.length > 0 ? path[path.length-1] : pos;
			
			if (path.length > 1 && current.x == start.x && current.y == start.y) return path;
			
			if (shape.indexOf(pos.x+";"+pos.y) !== -1)
			{
				for (var i=0; i<4; i++)
				{
					var angle = (dir-90) + 90*i;
					var tmp = {
						x: pos.x + Math.round(Math.cos(toRadians(angle))),
						y: pos.y + Math.round(Math.sin(toRadians(angle)))
					};
					
					var _path = helper(shape, tmp, angle, path);
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
		
		return helper(shape, start, 0);
	}
}

module.exports = Level;