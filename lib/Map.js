const EventEmitter2 = require("eventemitter2").EventEmitter2;
const Level = require("./Level.js");
const Point = require("./Point.js");
const Powerup = require("./Powerup.js");
const Bullet = require("./Bullet.js");
const Tank = require("./Tank.js");

class Map extends EventEmitter2
{
	constructor(level)
	{
		super();
		
		console.log("ini map > ", level.file);
		
		this.level = level;
		this.name = level.name;
		this.tiles = level.tiles;
		this.height = level.height;
		this.width = level.width;
		this.tile_size = level.tile_size;
		
		this.powerups = [];
		this.powerup_locations = [];
		for (var y=0; y<this.height; y++)
		{
			for (var x=0; x<this.width; x++)
			{
				if (this.tiles[y][x] == 2) this.powerup_locations.push({x: (x+0.5)*this.tile_size, y: (y+0.5)*this.tile_size});
			}
		}
	}
	
	getHeight()
	{
		return this.height * this.tile_size;
	}
	
	getWidth()
	{
		return this.width * this.tile_size;
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
	
	spawnPowerup()
	{
		var available_locations = [];
		
		var loc, pow;
		loop:
		for (var i=0; i<this.powerup_locations.length; i++)
		{
			loc = this.powerup_locations[i];
			for (var p=0; p<this.powerups.length; p++)
			{
				pow = this.powerups[p];
				if (loc.x == pow.x && loc.y == pow.y) continue loop;
			}
			available_locations.push(loc);
		}
		
		if (available_locations.length > 0)
		{
			var pos = available_locations[Math.floor(Math.random() * available_locations.length)];
			
			var powerup = new Powerup(pos.x, pos.y);
			this.powerups.push(powerup);
			this.emit("powerupSpawned", powerup);
			console.log("> spawn powerup ("+powerup.name+") ", pos);
			
			return true;
		}
		else
		{
			return false;
		}
	}
	
	despawnPowerup(id)
	{
		for (var p in this.powerups)
		{
			if (this.powerups[p].id == id)
			{
				this.powerups.splice(p, 1);
				break;
			}
		}
	}
	
	checkCollision(obj)
	{
		if (obj instanceof Bullet)
		{
			var bullet = obj;
			var x = bullet.x;
			var y = bullet.y;
			
			var tile = this.getTileAtPos(x, y);
			
			if (tile != null && tile.type == 1)
			{
				console.log("B:"+obj.id+" collision with ", tile);
				var tmp = bullet.clone();
				
				var offset_x = bullet.x - (tile.x_abs + tile.size/2);
				var offset_y = bullet.y - (tile.y_abs + tile.size/2);
				
				var penetration = 0;
			}
			
			return this.getTileAtPos(x, y);
		}
		else if (obj instanceof Tank)
		{
			var tank = obj;
			
			var center = this.getTileAtPos(tank.x, tank.y);
			if (center == null) return null;
			var collisions = [];
			
			for (var x=Math.max(center.x-1, 0); x<=Math.min(center.x+1, this.width-1); x++)
			{
				for (var y=Math.max(center.y-1, 0); y<=Math.min(center.y+1, this.height-1); y++)
				{
					var tile = this.getTile(x, y);
					if (tile == null || tile.type != 1) continue;
					
					var dist = 100;
					if (tile.x_abs <= tank.x && tile.x_abs + tile.size >= tank.x)
					{
						dist = Math.abs((tile.y_abs + tile.size / 2) - tank.y) - tile.size / 2 - tank.hitbox_r;
					}
					else if (tile.y_abs <= tank.y && tile.y_abs + tile.size >= tank.y)
					{
						dist = Math.abs((tile.x_abs + tile.size / 2) - tank.x) - tile.size / 2 - tank.hitbox_r;
					}
					else
					{
						var p = new Point(tank.x, tank.y);
						dist = Math.min(
							p.distanceTo(tile.x_abs, tile.y_abs),
							p.distanceTo(tile.x_abs + tile.size, tile.y_abs),
							p.distanceTo(tile.x_abs, tile.y_abs + tile.size),
							p.distanceTo(tile.x_abs + tile.size, tile.y_abs + tile.size)
						) - tank.hitbox_r;
					}
					if (dist <= 0) collisions.push(tile);
				}
			}
			
			return collisions.length > 0 ? collisions : null;
		}
	}
}

module.exports = Map;