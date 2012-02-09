"use strict";

var dgram = require("dgram");
var net = require("net");

var _decodeProtocol = exports._decodeProtocol = function(data) {
    var length = 0;
    var buffer = new Buffer("");

    return function(data) {
        buffer = new Buffer(buffer.toString() + data.toString());

        var chunk = data.toString();
        if (length === 0 && chunk.indexOf(":") >= 0) {
            // partial or full message where length can be
            // determined
            var l = buffer.toString();
            length = Number(l.substr(0, l.indexOf(":")));

            // reset buffer
            buffer = new Buffer(chunk.substr(chunk.indexOf(":") + 1));
        }

        if (length > 0) {
            // is the message complete?
            if (buffer.length === length) {
                this.emit("message", buffer);

                // reset
                buffer = new Buffer("");
                length = 0;
            }
        }
    };
};

exports.offRamp = function(listenPort, dstPort, dstHost) {
    dstHost = dstHost || "localhost";

    // shared proxy socket
    var proxy = dgram.createSocket("udp4");

    proxy.on("error", function(err) {
        // TODO simulate error conditions
        console.warn("Proxy socket error:", err);
        // TODO recreate socket?
    });

    var ramp = net.createServer(function(sock) {
        sock.on("data", _decodeProtocol());

        sock.on("message", function(message) {
            proxy.send(message, 0, message.length, dstPort, dstHost);
        });
    });

    ramp.on("close", function() {
        proxy.close();
    });

    ramp.listen(listenPort);

    return ramp;
};

exports.onRamp = function(listenPort, dstPort, dstHost, callback) {
    callback = callback || function() {};

    if (dstHost instanceof Function) {
        callback = dstHost;
        dstHost = undefined;
    }

    dstHost = dstHost || "localhost";

    // shared proxy connection
    var proxy = net.connect(dstPort, dstHost);
    proxy.on("error", function(err) {
        // TODO simulate error conditions
        console.warn("Proxy connection error:", err);
        // TODO recreate connection?
    });

    var ramp = dgram.createSocket("udp4");
    ramp.on("message", function(msg, rinfo) {
        proxy.write(msg.length + ":" + msg);
    });

    ramp.on("close", function() {
        proxy.end();
    });

    ramp.on("listening", callback);

    ramp.bind(listenPort);

    return ramp;
};
