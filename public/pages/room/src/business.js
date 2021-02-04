class Business {
  constructor({ room, media, view, socketBuilder, peerBuilder }) {
    this.room = room;
    this.media = media;
    this.view = view;
    this.hasAudio = false;
    this.hasVideo = false;

    this.socketBuilder = socketBuilder;
    this.peerBuilder = peerBuilder;

    this.socket = {};
    this.currentStream = {};
    this.currentPeer = {};

    this.peers = new Map();
    this.usersRecordings = new Map();
  }

  static initialize(deps) {
    const instance = new Business(deps);

    return instance._init();
  }

  async _init() {
    try {
      this.currentStream = await this.media.getCamera();
      if (this.currentStream.getAudioTracks().length) {
        this.hasAudio = true;
      } else {
        this.view.toggleMuteButtonColor(true);
      }

      if (this.currentStream.getVideoTracks().length) {
        this.hasVideo = true;
      } else {
        this.view.toggleVideoButtonColor(true);
      }
    } catch (error) {
      const emptyAudio = this.media.createEmptyAudioTrack();
      const emptyVideo = this.media.createEmptyVideoTrack({
        width: 640,
        height: 480,
      });

      this.currentStream = new MediaStream([emptyAudio, emptyVideo]);
      this.view.toggleVideoButtonColor(true);
      this.view.toggleMuteButtonColor(true);
    }

    this.view.configureRecordButton(this.onRecordPressed.bind(this));
    this.view.configureLeaveButton(this.onLeavePressed.bind(this));
    this.view.configureMuteButton(this.onMutePressed.bind(this), this.hasAudio);
    this.view.configureVideoButton(
      this.onVideoPressed.bind(this),
      this.hasVideo
    );

    this.socket = this.socketBuilder
      .setOnUserConnected(this.onUserConnected())
      .setOnUserDisconnected(this.onUserDisconnected())
      .build();

    this.currentPeer = await this.peerBuilder
      .setOnError(this.onPeerError())
      .setOnConnectionOpened(this.onPeerConnectionOpened())
      .setOnCallReceived(this.onPeerCallReceived())
      .setOnPeerStreamReceived(this.onPeerStreamReceived())
      .setOnCallError(this.onPeerCallError())
      .setOnCallClose(this.onPeerCallClose())
      .build();

    this.addVideoStream(this.currentPeer.id);
  }

  addVideoStream(userId, stream = this.currentStream) {
    if (stream.active) {
      const recorderInstance = new Recorder(userId, stream);
      this.usersRecordings.set(recorderInstance.filename, recorderInstance);

      if (this.recordingEnabled) {
        recorderInstance.startRecording();
      }
    }

    let videoTracks = stream.getVideoTracks();

    Util.sleep(1000).then(() => {
      const isTrackUnavailable = videoTracks[0] ? videoTracks[0].muted : true;

      if (isTrackUnavailable) {
        if (videoTracks.length) {
          stream.removeTrack(stream.getVideoTracks()[0]);
        }
        stream.addTrack(
          this.media.createEmptyVideoTrack({
            width: 640,
            height: 480,
          })
        );
      }
    });

    const isCurrentId = userId === this.currentPeer.id;
    this.view.renderVideo({
      userId,
      stream,
      isCurrentId,
    });
  }

  onUserConnected() {
    return (userId) => {
      this.currentPeer.call(userId, this.currentStream);
    };
  }

  onUserDisconnected() {
    return (userId) => {
      if (this.peers.has(userId)) {
        this.peers.get(userId).call.close();
        this.peers.delete(userId);
      }

      this.view.setParticipants(this.peers.size);
      this.stopRecording(userId);
      this.view.removeVideoElement(userId);
    };
  }

  onPeerError() {
    return (error) => {
      console.error("Error on peer!", error);
    };
  }

  onPeerConnectionOpened() {
    return (peer) => {
      const id = peer.id;
      this.socket.emit("join-room", this.room, id);
    };
  }

  onPeerCallReceived() {
    return (call) => {
      call.answer(this.currentStream);
    };
  }

  onPeerStreamReceived() {
    return (call, stream) => {
      const callerId = call.peer;
      if (this.peers.has(callerId)) {
        return;
      }

      this.addVideoStream(callerId, stream);
      this.peers.set(callerId, { call });
      this.view.setParticipants(this.peers.size);
    };
  }

  onPeerCallError() {
    return (call, error) => {
      this.view.removeVideoElement(call.peer);
    };
  }

  onPeerCallClose() {
    return (call) => {};
  }

  onRecordPressed(recordingEnabled) {
    this.recordingEnabled = recordingEnabled;
    for (const [key, value] of this.usersRecordings) {
      if (this.recordingEnabled) {
        value.startRecording();
        continue;
      }

      this.stopRecording(key);
    }
  }

  async onLeavePressed(recordingActive) {
    this.recordingActive = recordingActive;
    for (const [key, value] of this.usersRecordings) {
      if (!this.recordingActive) {
        await value.stopRecording();
      }
    }

    this.usersRecordings.forEach((value, key) => value.download());
  }

  onVideoPressed(isInactive) {
    this.hasVideo = !isInactive;
    this.currentStream.getVideoTracks()[0].enabled = this.hasVideo;
  }

  onMutePressed(isInactive) {
    this.hasAudio = !isInactive;
    this.currentStream.getAudioTracks()[0].enabled = this.hasAudio;
  }

  // If an user join and exits the call during recording
  // We have to stop his/her previous recordings
  async stopRecording(userId) {
    const usersRecordings = this.usersRecordings;
    for (const [key, value] of usersRecordings) {
      const isContextUser = key.includes(userId);

      if (!isContextUser) continue;

      const rec = value;
      const isRecordingActive = rec.recordingActive;
      if (!isRecordingActive) continue;

      await rec.stopRecording();
      // this.playRecordings(key);
    }
  }

  playRecordings(userId) {
    const user = this.usersRecordings.get(userId);

    const videosURLs = user.getAllVideoURLs();
    videosURLs.map((url) => {
      this.view.renderVideo({ url, userId });
    });
  }
}
