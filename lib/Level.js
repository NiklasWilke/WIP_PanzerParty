class Level
{
	constructor(file)
	{
		var level = require(file);
		
		this.file = file;
		this.name = level.name;
		this.tiles = level.tiles;
		this.size = this.tiles.length;
		this.tile_size = 100 / this.size;
		
		this.powerups = [];
		this.powerup_locations = [];
		for (var y=0; y<this.tiles.length; y++)
		{
			for (var x=0; x<this.tiles[y].length; x++)
			{
				if (this.tiles[y][x] == 2) this.powerup_locations.push({x: (x+0.5)*this.tile_size, y: (y+0.5)*this.tile_size});
			}
		}
	}
	
	getTile(x, y)
	{
		if (x < this.size && y < this.size)
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
}

module.exports = Level;