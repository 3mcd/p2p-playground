import Rx from 'rx';

Rx.Observable.fromServerConnection = (conn, openObserver, closeObserver) => {
  function peerClose() {
    if (closeObserver) {
      closeObserver.onNext();
      closeObserver.onCompleted();
    }

    conn.destroy();
  }

  let observable = new Rx.AnonymousObservable(function (obs) {
    function openHandler(e) {
      openObserver.onNext(e);
      openObserver.onCompleted();
    }

    function dataHandler(data) {
      console.log(data);
      obs.onNext(data);
    }

    function errorHandler(e) {
      obs.onError(e);
    }

    function closeHandler(e) {
      obs.onCompleted();
    }

    openObserver && conn.on('open', openHandler);
    conn.on('error', errorHandler);
    conn.on('connection', dataHandler);
    conn.on('close', dataHandler);

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
