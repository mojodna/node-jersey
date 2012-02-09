[![Build
Status](https://secure.travis-ci.org/mojodna/node-jersey.png)](http://travis-ci.org/mojodna/node-jersey)

# node-jersey

Bridges UDP packets over the information superhighway.

## Why?

Say you're using [metricsd](https://github.com/mojodna/metricsd) or one of the
other [statsd](https://github.com/etsy/statsd) implementations and running it
on a different network than your application (probably a silly idea, but it
happens). A different network that blocks outbound UDP packets
(\*cough\*Azure\*cough\*).

You could modify your application to send metrics via TCP (with Node, you could
fake non-blocking-ness), but then you'd need to modify the metricsd/statsd
server to speak TCP (and break the protocol in the process or risk lots of
incorrect meters being created).

Or, you could continue as you were, sending metrics over UDP to `localhost` and
let Jersey proxy them over a TCP socket and back to UDP on the side hosting the
metricsd/statsd server. Then, if you later move both applications to the same
network, simply reconfigure the server name and stop using Jersey.

## How?

Spin up an on-ramp (UDP → TCP), listening on `udp://localhost:8125` and
connecting to `tcp://localhost:8126` by default:

```bash
$ jersey-onramp
```

Spin up an off-ramp (TCP → UDP), listening on `tcp://localhost:8126` and
connecting to `udp://localhost:8125` by default:

```bash
$ jersey-offramp
```

(Note: these form a loop when run on the same host. Use `--help` for options.)

You can also create on- and off-ramps programmatically. See `bin/onramp` and
`bin/offramp` to see how.

## License

Copyright (c) 2012 Seth Fitzsimmons

Published under the BSD License.
