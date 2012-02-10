"use strict";

var dgram = require("dgram");
var net = require("net");

/**
 * Generate a protocol decoder suitable for associating with 'data' events.
 */
var _protocolDecoder = exports._protocolDecoder = function() {
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

/**
 * Create an off-ramp; receive data via TCP and output it on a UDP socket.
 *
 * @param {integer} listenPort TCP port to listen on.
 * @param {integer} dstPort Target UDP port.
 * @param {string} [dstHost] Target UDP host.
 * @param {function} [callback] Called when the TCP server has started
 *                   listening.
 */
exports.offRamp = function(listenPort, dstPort, dstHost, callback) {
    callback = callback || function() {};

    if (dstHost instanceof Function) {
        callback = dstHost;
        dstHost = undefined;
    }

    dstHost = dstHost || "localhost";

    // shared proxy socket
    var proxy = dgram.createSocket("udp4");

    proxy.on("error", function(err) {
        // TODO simulate error conditions
        console.warn("Proxy socket error:", err);
        // TODO recreate socket?
    });

    var ramp = net.createServer(function(sock) {
        sock.on("data", _protocolDecoder());

        sock.on("message", function(message) {
            proxy.send(message, 0, message.length, dstPort, dstHost);
        });
    });

    ramp.on("close", function() {
        proxy.close();
    });

    ramp.on("listening", callback);

    ramp.listen(listenPort);

    return ramp;
};

/**
 * Create an on-ramp; receive data via UDP and output it via TCP.
 *
 * @param {integer} listenPort UDP port to listen on.
 * @param {integer} dstPort Target TCP port.
 * @param {string} [dstHost] Target TCP host.
 * @param {function} [callback] Called when the UDP server has started
 *                   listening.
 */
exports.onRamp = function(listenPort, dstPort, dstHost, callback) {
    callback = callback || function() {};

    if (dstHost instanceof Function) {
        callback = dstHost;
        dstHost = undefined;
    }

    dstHost = dstHost || "localhost";

    var ramp = dgram.createSocket("udp4");
    ramp.on("message", function(msg, rinfo) {
        // TODO a shared TCP connection would be nice, but invalid messages
        // combined together will confuse the protocol debugger
        var proxy = net.connect(dstPort, dstHost, function() {
            proxy.write(msg.length + ":" + msg);
            proxy.end();
        });
    });

    ramp.on("listening", callback);

    ramp.bind(listenPort);

    return ramp;
};
