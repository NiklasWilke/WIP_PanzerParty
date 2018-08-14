class Color
{
	constructor(h, s, l)
	{
		this.h = h;
		this.s = s;
		this.l = l;
		
		var rgb = Color.HSLtoRGB(this.h, this.s, this.l);
		this.r = rgb.r;
		this.g = rgb.g;
		this.b = rgb.b;
		
		this.hex = Color.RGBtoHEX(this.r, this.g, this.b);
		
		this.string = this.toString();
	}
	
	equals(c)
	{
		return this.h == c.h && this.s == c.s && this.l == c.l;
	}
	
	toString(type)
	{
		switch(type)
		{
			case "hex":
				return this.hex;
			case "rgb":
				return "rgb("+this.r+", "+this.g+", "+this.b+")";
			case "hsl":
			default:
				return "hsl("+this.h+", "+this.s+"%, "+this.l+"%)";
		}
	}
	
	static RGBtoHEX(r, g, b)
	{
		var toHex = function(c)
		{
			var hex = c.toString(16);
			return hex.length == 1 ? "0" + hex : hex;
		}
		return "#" + toHex(r) + toHex(g) + toHex(b);
	}
	
	// https://gist.github.com/mjackson/5311256
	static HSLtoRGB(h, s, l)
	{
		h /= 360, s /= 100, l /= 100;
		var r, g, b;

		if (s == 0)
		{
			r = g = b = l; // achromatic
		}
		else
		{
			function hue2rgb(p, q, t)
			{
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1/6) return p + (q - p) * 6 * t;
				if (t < 1/2) return q;
				if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
				return p;
			}

			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;

			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		}
		
		return {r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255)};
	}
	
	// https://gist.github.com/mjackson/5311256
	static fromRGB(r, g, b)
	{
		r /= 255, g /= 255, b /= 255;

		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max + min) / 2;

		if (max == min)
		{
			h = s = 0; // achromatic
		}
		else
		{
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

			switch (max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}
		
		return new Color(h, s, l);
	}
}

module.exports = Color;