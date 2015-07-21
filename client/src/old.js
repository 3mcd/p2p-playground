import Peer from 'peerjs';
import {CONFIG} from '../config';

var $stage = document.querySelector('#stage');
var $peerInput = document.querySelector('#peer-id');
var $id = document.querySelector('#id');
var p2p = new Peer(CONFIG.peer);
var handles = [];

const DEBOUNCE = 2000;

p2p.on('open',
  (id) => {
    $id.textContent = id;
    console.log(`Established connection to Peer server. ID ${ id }`);
  }
);

p2p.on('connection', bindEvents);

var prev;

$peerInput.addEventListener('change',
  (e) => {
    clearTimeout(prev);
    prev = setTimeout(
      () => {
        bindEvents(p2p.connect(e.target.value));
      }, DEBOUNCE
    )
  }
);

function bindEvents(conn) {
  console.log(`Established connection to ${ conn.peer }`);
  window.addEventListener('mousemove',
    (e) => {
      let rect = $stage.getBoundingClientRect();
      if (
        e.clientX > rect.left && e.clientX < rect.right &&
        e.clientY > rect.top && e.clientY < rect.bottom
      ) {
        let data = {
          id: p2p.id,
          x: e.clientX - $stage.offsetLeft,
          y: e.clientY - $stage.offsetTop
        };
        handleInput(data);
        conn.send(data);
      }
    }
  );
  conn.on('data', handleInput);
}

function handleInput(data) {
  let id = data.id;
  let el = handles.filter(
    (x) => x.dataset.id == id
  )[0];

  if (!el) {
    el = document.createElement('div');
    el.dataset.id = id;
    el.classList.add('box');
    $stage.appendChild(el);
    handles.push(el);
  }

  el.style.left = data.x + 'px';
  el.style.top = data.y + 'px';
}
