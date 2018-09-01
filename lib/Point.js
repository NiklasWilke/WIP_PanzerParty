class Point
{
	constructor(_x, _y)
	{
		this.x = _x;
		this.y = _y;
	}
	
	distanceTo(obj)
	{
		return Math.sqrt(Math.pow(this.x - obj.x, 2) + Math.pow(this.y - obj.y, 2));
	}
	
	distanceTo(x, y)
	{
		return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
	}
	
	static distance(a, b)
	{
		return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
	}
}

module.exports = Point;