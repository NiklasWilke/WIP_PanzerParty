String.prototype.trim = function()
{
	return this.toLowerCase().replace(/\s+/g,"-");
};

function isMobile(req)
{
	var ua = req.headers["user-agent"].toLowerCase();
	var isMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0, 4));

	return !!isMobile;
}

const crypto = require("crypto");
const express = require("express");
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
const GameManager = require("./lib/GameManager.js");
const game = new GameManager(io);


// setup express with mustache view engine
app.engine("html", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", __dirname + "\\public\\views");
app.use("/", express.static(__dirname + "\\public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

// render record view
app.get("/record", function(req, res)
{
	var data = {ip: ip.address(), port: port};
	res.render("record.html", data);
});

// render field view
app.get("/screen", function(req, res)
{
	var data = {ip: ip.address(), port: port};
	res.render("screen.html", data);
});

// render control view
app.get("/control", function(req, res)
{
	var colors = game.getAvailableColors();

	var data = {ip: ip.address(), port: port, available_colors: colors};
	res.render("control.html", data);
});

// render qr code
app.get("/qr", function(req, res)
{
	var code = qr.image("http://"+ip.address()+":"+port+"", {type: "svg"});
	res.type("svg");
	code.pipe(res);
});


app.get("/", function(req, res)
{
	//var data = {ip: ip.address(), port: port};

	if (isMobile(req))
	{
		res.redirect("/control");
	}
	else
	{
		res.redirect("/screen");
		//res.render("screen.html", data);
	}
});

// render privacy view
app.get("/datenschutz", function(req, res)
{
	var data = {};
	res.render("privacy.html", data);
});

app.get("/impressum", function(req, res)
{
	var data = {};
	res.render("impressum.html", data);
});

// render editor view
app.get("/editor", function(req, res)
{
	var data = {ip: ip.address(), port: port, levels: game.getLevels()};
	res.render("level_editor.html", data);
});

io.on("connection", function(socket)
{
	socket.on("stopServer", function(cb)
	{
		cb();
		process.exit();
	});
});


// start server
http.listen(port, function()
{
	console.log("Server running on "+ip.address()+":"+port+"!");
});
