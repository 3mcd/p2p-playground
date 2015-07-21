###p2p-playground

This repository contains an example application built with
[PeerJS](http://peerjs.com/) and
[RxJS](https://github.com/Reactive-Extensions/RxJS). This app provides a minimal
starting point for building a peer-to-peer application with reactive functional
programming techniques and [ES2015](https://babeljs.io/docs/learn-es2015/).

####Installation

Ensure you have the latest version of Node installed. Clone this repo and run
`npm install`.

####Usage

Navigate to `localhost:8000` and copy your ID. Open a separate browser window at
the same URL and paste the ID in the text input (or have a friend do it). After
~2000ms the server will attempt to establish a [WebRTC](http://www.webrtc.org/)
connection between the two clients. After the connection is made, the two
peers will send data in real time without help from a server.

Moving your cursor within the gray container will send information about the
position of your mouse directly to the peer client(s) in the form of
`{ x, y, peerId }`. These payloads are rendered as absolutely positioned `div`
elements inside of the container. That's it!

Experiment with this repository. What happens when you add a `delay()` operator
to the `dataConnection` or `mousemove` observables?

####Notes

The application uses [Express](http://expressjs.com/) to serve assets and host
the PeerJS server. The client bundle file is served via `webpack-dev-middleware`
and will update when the source files change.
