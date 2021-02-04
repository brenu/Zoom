class View {
  constructor() {
    this.recorderBtn = document.getElementById("record");
    this.leaveBtn = document.getElementById("leave");
    this.videoBtn = document.getElementById("video-button");
    this.muteBtn = document.getElementById("mute-button");
  }

  createVideoElement({ muted = true, src, srcObject }) {
    const video = document.createElement("video");

    video.muted = muted;
    video.src = src;
    video.srcObject = srcObject;

    if (src) {
      video.conrols = true;
      video.loop = true;
      Util.sleep(200).then((_) => video.play());
    }

    if (srcObject) {
      video.addEventListener("loadedmetadata", (_) => video.play());
    }
    return video;
  }

  renderVideo({ userId, stream = null, url = null, isCurrentId = false }) {
    const video = this.createVideoElement({
      muted: isCurrentId,
      src: url,
      srcObject: stream,
    });
    this.appendToHTMLTree(userId, video, isCurrentId);
  }

  appendToHTMLTree(userId, video, isCurrentId) {
    const div = document.createElement("div");
    div.id = userId;
    div.classList.add("wrapper");
    div.append(video);
    const div2 = document.createElement("div");
    div2.innerText = isCurrentId ? "" : userId;
    div.append(div2);

    const videoGrid = document.getElementById("video-grid");
    videoGrid.append(div);
    return;
  }

  setParticipants(count) {
    const myself = 1;
    const participants = document.getElementById("participants");
    participants.innerHTML = count + myself;
  }

  removeVideoElement(id) {
    const element = document.getElementById(id);

    element.remove();
  }

  toggleRecordingButtonColor(isActive = true) {
    this.recorderBtn.style.color = isActive ? "red" : "white";
  }

  toggleVideoButtonColor(isActive = true) {
    this.videoBtn.style.color = isActive ? "red" : "gray";
  }

  toggleMuteButtonColor(isActive = true) {
    this.muteBtn.style.color = isActive ? "red" : "gray";
  }

  onRecordClick(command) {
    this.recordingEnabled = false;
    return () => {
      const isActive = (this.recordingEnabled = !this.recordingEnabled);

      command(this.recordingEnabled);
      this.toggleRecordingButtonColor(isActive);
    };
  }

  onLeaveClick(command) {
    return async () => {
      command();

      await Util.sleep(3000);
      window.location = "/pages/home";
    };
  }

  onVideoClick(command, hasSource) {
    this.isVideoStopped = false;
    return () => {
      if (hasSource) {
        const isActive = (this.isVideoStopped = !this.isVideoStopped);
        command(this.isVideoStopped);

        this.toggleVideoButtonColor(isActive);
      }
    };
  }

  onMuteClick(command, hasSource) {
    this.isMuted = false;
    return () => {
      if (hasSource) {
        const isActive = (this.isMuted = !this.isMuted);
        command(this.isMuted);

        this.toggleMuteButtonColor(isActive);
      }
    };
  }

  configureRecordButton(command) {
    this.recorderBtn.addEventListener("click", this.onRecordClick(command));
  }

  configureLeaveButton(command) {
    this.leaveBtn.addEventListener("click", this.onLeaveClick(command));
  }

  configureVideoButton(command, hasSource) {
    this.videoBtn.addEventListener(
      "click",
      this.onVideoClick(command, hasSource)
    );
  }

  configureMuteButton(command, hasSource) {
    this.muteBtn.addEventListener(
      "click",
      this.onMuteClick(command, hasSource)
    );
  }
}
