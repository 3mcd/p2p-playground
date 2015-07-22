import Rx from 'rx';
import Peer from 'peerjs';
import config from '../config';
import './extensions';

var $ = document.querySelector.bind(document);

/**
 * Main container element where our peer-to-peer data will be displayed.
 */
var $stage = $('#stage');

/**
 * Text input element of our handle's color.
 */
var $color = $('#color');

/**
 * Text input element that contains the id of the peer we wish to connect to.
 */
var $peer = $('#peer-id');

/**
 * The element that displays our peer id.
 */
var $id = $('#id');

/**
 * List of all handles tracked in our application.
 */
var handles = [];

/**
 * Array of potential default handle colors.
 */
var colors = ['ED0456', 'FCCE1B', '99ED09', '1E9EFC', '9000D8'];

/**
 * Establish a connection to the Peer server.
 */
var p2p = new Peer(config.peer);

const DEFAULT_COLOR = Math.round(Math.random() * (colors.length - 1));
const HANDLE_RADIUS = 15;

/**
 * Amount of time to wait for next input value change in `$peer` element
 * before attempting to connect to peer.
 */
const DEBOUNCE = 2000;

$color.value = `#${colors[DEFAULT_COLOR]}`;

/**
 * Create an Observable that will call `onNext(conn)` each time a Peer
 * DataConnection is established from a remote peer.
 */
var serverConnection = Rx.Observable.fromPeerServer(
  p2p, // Peer sever connection object
  Rx.Observer.create( // Observer that completes when connected to Peer server
    (id) => {
      console.log(`Established connection to Peer server. ID ${ id }`);
      $id.textContent = id;
    }
  )
);

/**
 * Create an Observable that will call `onNext(e)` when the 'keydown' event
 * occurs on the `$peer` input.
 */
var input = Rx.Observable.fromEvent($peer, 'keydown')
  .debounce(DEBOUNCE)
  .map(
    (e) => e.target.value
  )
  .filter(
    (id) => id.length > 3
  );

/**
 * Connect to peer with id yielded from input Observable.
 */
var dataConnection = input
  .map(
    (id) => p2p.connect(id)
  );

/**
 * Since the client can either be handed a DataConnection remotely (via
 * `dataConnection`) or locally (via `serverConnection`), we merge the two
 * observables into a single stream to consolidate how they are handled into
 * a single subscriber callback.
 */
var connections = Rx.Observable.merge(serverConnection, dataConnection);

connections.subscribe(handleConnection);

/**
 * Create an Observable that will call `onNext(e)` when a 'mousemove' event
 * occurs within the window element.
 */
var mousemove = Rx.Observable.fromEvent(window, 'mousemove')
  /**
   * Map each event object to an object literal containing imporant information
   * about the event, as well as some additional data like our local id and
   * specified handle color.
   */
  .map(
    (e) => ({
      id: p2p.id,
      /**
       * We subtract the `$stage` offsets because the coordinate data we send
       * is relative to the stage element, not the window. We also subtract
       * the handle radius to center the cursor position.
       */
      x: e.clientX - $stage.offsetLeft - HANDLE_RADIUS,
      y: e.clientY - $stage.offsetTop - HANDLE_RADIUS,
      c: $color.value
    })
  )
  /**
   * Ensure each x, y coordinate is a valid move within the `$stage` element.
   */
  .map(
    (data) => {
      let $el = findPeerHandle(data.id);

      if ($el) {
        let rect1 = getRect($stage);
        let rect2 = getRect($el);
        let valid = canMoveRectTo(rect1 /* stage */, rect2 /* handle */, {
          /**
           * Add the `$stage` offsets back so we can calculate collisions via
           * rectangles, which are relative to the window.
           */
          x: data.x + $stage.offsetLeft,
          y: data.y + $stage.offsetTop
        });

        if (!valid.x)
          data.x = null; // Don't yield transformation if a collision occurs

        if (!valid.y)
          data.y = null;
      }

      return data;
    }
  );

function handleConnection(conn) {
  /**
   * Create a Subject that will call `onNext(data)` when a DataConnection sends
   * data. The Subject can also execute `onNext()` to send data back up the
   * wire.
   */
  let dataConnection = Rx.Observable.fromPeerDataConnection(
    conn, // DataConnection
    Rx.Observer.create( // Observer that completes when the connection is made
      () => {
        /**
         * Subscribe to the mousemove Observable, sending the transformed event
         * data to the connected peer(s), and updating our local handle
         * position.
         */
        mousemove.subscribe(
          (data) => {
            dataConnection.onNext(data);
            updateHandle(data);
          }
        );
      }
    )
  );

  /**
   * Subscribe to the `dataConnection` subject, updating remote peers' handles
   * as they send data to us.
   */
  dataConnection.subscribe(updateHandle);
}

/**
 * Update the position of a remote handle or the local handle.
 */
function updateHandle(data) {
  let $el = findPeerHandle(data.id);

  if (!$el) { // Create the handle if it does not already exist.
    let handleSize = HANDLE_RADIUS * 2 + 'px';

    $el = document.createElement('div');
    $el.style.width = handleSize;
    $el.style.height = handleSize;
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

function canMoveRectTo(rect1, rect2, v) {
  var dx = rect2.width;
  var dy = rect2.height;
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
