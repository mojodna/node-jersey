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
