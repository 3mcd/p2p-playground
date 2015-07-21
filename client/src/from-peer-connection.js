import Rx from 'rx';

Rx.Observable.fromPeerConnection = (conn, openObserver, closeObserver) => {
  function peerClose() {
    if (closeObserver) {
      closeObserver.onNext();
      closeObserver.onCompleted();
    }

    conn.close();
  }

  let observable = new Rx.AnonymousObservable(function (obs) {
    function openHandler(e) {
      openObserver.onNext(e);
      openObserver.onCompleted();
    }

    function dataHandler(data) {
      obs.onNext(data);
    }

    function errorHandler(e) {
      obs.onError(e);
    }

    function closeHandler(e) {
      obs.onCompleted();
    }

    conn.on('open', openHandler);
    conn.on('error', errorHandler);
    conn.on('data', dataHandler);
    conn.on('close', peerClose);

    return peerClose;
  });

  let observer = Rx.Observer.create(
    (data) => {
      conn.send(data);
    },
    (e) => {
      peerClose();
    },
    () => {
      peerClose();
    }
  );

  return Rx.Subject.create(observer, observable);
};
