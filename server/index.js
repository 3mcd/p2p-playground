var config = require('../config'),
    express = require('express'),
    peer = require('peer'),
    w = require('webpack')(config.webpack),
    wm = require('webpack-dev-middleware')(w, config.webpack.dev);

var app = express();
var server = app.listen(8000);

app.use(wm);

app.use(express.static(process.cwd() + '/public'));
app.use('/peerjs', peer.ExpressPeerServer(server, config.peer));
