import Rx from 'rx';
import Peer from 'peerjs';
import {CONFIG} from '../config';
import './from-peer-connection';
import './from-server-connection';

const STAGE = document.querySelector('#stage');
const PEER_ID_INPUT = document.querySelector('#peer-id');
const LOCAL_ID = document.querySelector('#id');
const P2P = new Peer(CONFIG.peer);

function getPeerStream(conn) {
  let id = conn.peer;
  return Rx.Observable.fromPeerConnection(conn, Rx.Observer.create(
    () => console.log(`Connected to peer ${ id }`)
  ));
}

var peerServerStream = Rx.Observable.fromServerConnection(
    P2P,
    // onNext() called on 'connect' event
    Rx.Observer.create(
      (id) => {
        LOCAL_ID.textContent = id;
        console.log(`Connected to Peer server with id ${ id }`);
      }
    )
  )
  .flatMap(getPeerStream);

var idInputStream = Rx.Observable.fromEvent(PEER_ID_INPUT, 'input')
  .debounce(1200)
  .filter(
    (e) => e.target.value.length > 0
  )
  .map(
    (e) => e.target.value
  );

var peerStream = idInputStream
  .map(
    (id) => {
      return P2P.connect(id);
    }
  );

peerServerStream.subscribe();

peerStream.subscribe();

var dataStream = peerServerStream
  .map(
    (data) => ({
      id: data.id,
      x: data.x,
      y: data.y
    })
  );

var elObserver = Rx.Observer.create(
  (data) => {
    console.log(data);

    let el = document.querySelector(`[data-id=${ el }]`);

    if (!el) {
      el = document.createElement('div');
      el.attributes['data-id'] = el;
      STAGE.appendChild(el);
    }

    el.style.left = data.x;
    el.style.top = data.y;
  }
);

dataStream.subscribe(elObserver);
