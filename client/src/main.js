import Rx from 'rx';
import Peer from 'peerjs';
import {CONFIG} from '../config';
import './extensions';

var $stage = document.querySelector('#stage');
var $colorInput = document.querySelector('#color');
var $peerInput = document.querySelector('#peer-id');
var $id = document.querySelector('#id');
var p2p = new Peer(CONFIG.peer);
var handles = [];
var colors = ['ED0456', 'FCCE1B', '99ED09', '1E9EFC', '9000D8'];

const DEFAULT_COLOR = Math.round(Math.random() * (colors.length - 1));
const DEBOUNCE = 2000;

$colorInput.value = `#${colors[DEFAULT_COLOR]}`;

var serverConnection = Rx.Observable.fromPeerServer(p2p,
  Rx.Observer.create(
    (id) => {
      console.log(`Established connection to Peer server. ID ${ id }`);
      $id.textContent = id;
    }
  )
);

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

var connections = Rx.Observable.merge(serverConnection, dataConnection);

connections.subscribe(handleConnection);

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
      y: e.clientY - $stage.offsetTop,
      c: $colorInput.value
    })
  );

function handleConnection(conn) {
  let dataConnection = Rx.Observable.fromPeerDataConnection(conn,
    Rx.Observer.create(
      () => {
        mousemove.subscribe(
          (data) => {
            dataConnection.onNext(data);
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
    (x) => x.dataset['peerId'] == data.id
  )[0];

  if (!el) {
    el = document.createElement('div');
    el.dataset['peerId'] = data.id;
    el.classList.add('Stage-peer');
    $stage.appendChild(el);
    handles.push(el);
  }

  el.style.backgroundColor = data.c;
  el.style.left = data.x + 'px';
  el.style.top = data.y + 'px';
}
