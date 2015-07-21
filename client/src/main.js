import Peer from 'peerjs';
import {CONFIG} from '../config';

const STAGE = document.querySelector('#stage');
const PEER_ID_INPUT = document.querySelector('#peer-id');
const LOCAL_ID = document.querySelector('#id');
const P2P = new Peer(CONFIG.peer);
const DEBOUNCE = 2000;

var handles = [];

P2P.on('open',
  (id) => {
    LOCAL_ID.textContent = id;
    console.log(`Established connection to Peer server. ID ${ id }`);
  }
);

P2P.on('connection', bindEvents);

var prev;

PEER_ID_INPUT.addEventListener('change',
  (e) => {
    clearTimeout(prev);
    prev = setTimeout(
      () => {
        bindEvents(P2P.connect(e.target.value));
      }, DEBOUNCE
    )
  }
);

function bindEvents(conn) {
  console.log(conn);
  window.addEventListener('mousemove',
    (e) => {
      let rect = STAGE.getBoundingClientRect();
      if (
        e.clientX > rect.left && e.clientX < rect.right &&
        e.clientY > rect.top && e.clientY < rect.bottom
      ) {
        let data = {
          id: P2P.id,
          x: e.clientX - STAGE.offsetLeft,
          y: e.clientY - STAGE.offsetTop
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
    STAGE.appendChild(el);
    handles.push(el);
  }

  el.style.left = data.x + 'px';
  el.style.top = data.y + 'px';
}

function findPos (obj) {
  let left = 0,
    top = 0;

  if (obj.offsetParent) {
    do {
      left += obj.offsetLeft;
      top += obj.offsetTop;
    } while (obj = obj.offsetParent);

    return { x: left, y: top };
  }
}
