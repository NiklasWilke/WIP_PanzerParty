String.prototype.trim = function()
{
	return this.toLowerCase().replace(/\s+/g,"-");
};

const crypto = require("crypto");
const express = require("express");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const mustacheExpress = require("mustache-express");
const qr = require("qr-image");  
const ip = require("ip");
const port = 8000;

const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);


const Bullet = require("./lib/Bullet.js");
const Tank = require("./lib/Tank.js");
const GameEngine = require("./lib/GameEngine.js");
const game = new GameEngine(io);


// setup express with mustache view engine
app.engine("html", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", __dirname + "\\views");
app.use("/", express.static(__dirname + "\\public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

// render field view
app.get("/screen", function(req, res)
{
	var data = {ip: ip.address(), port: port};
	res.render("screen.html", data);
});

// render qr code
app.get("/qr", function(req, res)
{
	var code = qr.image("http://"+ip.address()+":"+port+"", {type: "svg"});
	res.type("svg");
	code.pipe(res);
});

// render controller view
app.get("/", function(req, res)
{
	var data = {ip: ip.address(), port: port};
	res.render("control.html", data);
});

// render editor view
app.get("/editor", function(req, res)
{
	var data = {ip: ip.address(), port: port};
	res.render("level_editor.html", data);
});


// start server
http.listen(port, function()
{
	console.log("Example app running on "+ip.address()+":"+port+"!");
});