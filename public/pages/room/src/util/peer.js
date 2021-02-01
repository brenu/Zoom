class PeerBuilder {
  constructor({ peerConfig }) {
    this.peerConfig = peerConfig;

    const defaultFunctionValue = () => {};
    this.onError = defaultFunctionValue;
    this.onCallError = defaultFunctionValue;
    this.onCallReceived = defaultFunctionValue;
    this.onConnectionOpened = defaultFunctionValue;
    this.onPeerStreamReceived = defaultFunctionValue;
    this.onCallClose = defaultFunctionValue;
  }

  setOnCallError(fn) {
    this.onCallError = fn;

    return this;
  }

  setOnCallClose(fn) {
    this.onCallClose = fn;

    return this;
  }

  setOnError(fn) {
    this.onError = fn;

    return this;
  }

  setOnCallReceived(fn) {
    this.onCallReceived = fn;

    return this;
  }

  setOnConnectionOpened(fn) {
    this.onConnectionOpened = fn;

    return this;
  }

  setOnPeerStreamReceived(fn) {
    this.onPeerStreamReceived = fn;

    return this;
  }

  _prepareCallEvent(call) {
    call.on("stream", (stream) => this.onPeerStreamReceived(call, stream));
    call.on("error", (error) => this.onCallError(call, error));
    call.on("close", (_) => this.onCallClose(call));
    this.onCallReceived(call);
  }

  // Add call event behaviours also for who's calling

  _preparePeerInstanceFunction(peerModule) {
    class PeerCustomModule extends peerModule {}

    const peerCall = PeerCustomModule.prototype.call;
    const context = this;
    PeerCustomModule.prototype.call = function (id, stream) {
      const call = peerCall.apply(this, [id, stream]);

      // Here comes the magic, we intercept the call and add all of our
      // call events to the ones who are calling too.
      context._prepareCallEvent(call);

      return call;
    };

    return PeerCustomModule;
  }

  build() {
    const PeerCustomInstance = this._preparePeerInstanceFunction(Peer);
    const peer = new PeerCustomInstance(...this.peerConfig);

    peer.on("error", this.setOnError);
    peer.on("call", this._prepareCallEvent.bind(this));

    return new Promise((resolve) =>
      peer.on("open", (id) => {
        this.onConnectionOpened(peer);
        return resolve(peer);
      })
    );
  }
}
