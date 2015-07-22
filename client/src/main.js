import Rx from 'rx';
import Peer from 'peerjs';
import config from '../config';
import './extensions';

var $ = document.querySelector.bind(document);

var $stage = $('#stage');
var $colorInput = $('#color');
var $peerInput = $('#peer-id');
var $id = $('#id');
var p2p = new Peer(config.peer);
var handles = [];
var colors = ['ED0456', 'FCCE1B', '99ED09', '1E9EFC', '9000D8'];

const DEFAULT_COLOR = Math.round(Math.random() * (colors.length - 1));
const DEBOUNCE = 2000;
const WIDTH = 30;

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
  .map(
    (e) => ({
      id: p2p.id,
      x: e.clientX - $stage.offsetLeft - WIDTH / 2,
      y: e.clientY - $stage.offsetTop - WIDTH / 2,
      c: $colorInput.value
    })
  )
  .map(
    (data) => {
      let $el = findPeerHandle(data.id);

      if ($el) {
        let rect1 = getRect($stage);
        let rect2 = getRect($el);
        let valid = canMoveToPoint(rect1, rect2, {
          x: data.x + $stage.offsetLeft,
          y: data.y + $stage.offsetTop
        });

        if (!valid.x)
          data.x = null;

        if (!valid.y)
          data.y = null;
      }

      return data;
    }
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
  let $el = findPeerHandle(data.id);

  if (!$el) {
    $el = document.createElement('div');
    $el.dataset['peerId'] = data.id;
    $el.classList.add('Stage-peer');
    $stage.appendChild($el);
    handles.push($el);
  }

  $el.style.backgroundColor = data.c;

  if (data.x) $el.style.left = data.x + 'px';
  if (data.y) $el.style.top = data.y + 'px';
}

function getRect(el) {
  return el.getBoundingClientRect();
}

function canMoveToPoint(rect1, rect2, v) {
  var dx = rect2.width;
  var dy = rect2.height;
  console.log(rect1.left, v.x);
  console.log(rect1.left < v.x, rect1.right > v.x + dx);
  return {
    x: (rect1.left < v.x && rect1.right > v.x + dx),
    y: (rect1.top < v.y && rect1.bottom > v.y + dy),
  }
}

function findPeerHandle(id) {
  return handles.filter(
    (x) => x.dataset['peerId'] == id
  )[0];
}
