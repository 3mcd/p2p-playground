import Rx from 'rx';
import Peer from 'peerjs';
import {CONFIG} from '../config';
import './from-peer-connection';
import './from-server-connection';

var $stage = document.querySelector('#stage');
var $peerInput = document.querySelector('#peer-id');
var $id = document.querySelector('#id');
var p2p = new Peer(CONFIG.peer);
var handles = [];

const DEBOUNCE = 2000;

var server = Rx.Observable.fromServerConnection(p2p,
  Rx.Observer.create(
    (id) => {
      console.log(`Established connection to Peer server. ID ${ id }`);
      $id.textContent = id;
    }
  )
);

server.subscribe(handleConnection);

var input = Rx.Observable.fromEvent($peerInput, 'keydown')
  .debounce(DEBOUNCE)
  .map(
    (e) => e.target.value
  )
  .filter(
    (id) => id.length > 3
  );

var dataConnection = input
  .map(
    (id) => p2p.connect(id)
  );

dataConnection.subscribe(handleConnection);

var mousemove = Rx.Observable.fromEvent(window, 'mousemove')
  .filter(
    (e) => {
        let rect = $stage.getBoundingClientRect();
        return (
          e.clientX > rect.left && e.clientX < rect.right &&
          e.clientY > rect.top && e.clientY < rect.bottom
        );
    }
  )
  .map(
    (e) => ({
        id: p2p.id,
        x: e.clientX - $stage.offsetLeft,
        y: e.clientY - $stage.offsetTop
    })
  );

function handleConnection(conn) {
  let dataConnection = Rx.Observable.fromPeerConnection(conn,
    Rx.Observer.create(
      () => {
        mousemove.subscribe(
          (data) => {
            conn.send(data);
            updateHandle(data);
          }
        );
      }
    )
  );

  dataConnection.subscribe(updateHandle);
}

function updateHandle(data) {
  let el = handles.filter(
    (x) => x.dataset.id == data.id
  )[0];

  if (!el) {
    el = document.createElement('div');
    el.dataset.id = data.id;
    el.classList.add('box');
    $stage.appendChild(el);
    handles.push(el);
  }

  el.style.left = data.x + 'px';
  el.style.top = data.y + 'px';
}
