const EventEmitter2 = require("eventemitter2").EventEmitter2;
const Bullet = require("./Bullet.js")

const DEV = false;

class Event extends EventEmitter2
{

	constructor()
	{
		super();
		this.duration = 10;
		



	}

	callEvent(gm, ge, map, eventtype)
	{
		ge.spawnBot();
	}

}