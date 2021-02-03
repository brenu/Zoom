class Media {
  async getCamera() {
    this.hasAudioDevices = false;
    this.hasVideoDevices = false;

    const devices = await navigator.mediaDevices.enumerateDevices();

    this.hasAudioDevices =
      devices.filter((device) => device.kind == "audioinput").length > 0;
    this.hasVideoDevices =
      devices.filter((device) => device.kind == "videoinput").length > 0;

    const permissions = await navigator.mediaDevices.getUserMedia({
      audio: this.hasAudioDevices,
      video: this.hasVideoDevices,
    });

    return permissions;
  }

  createEmptyAudioTrack() {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    const track = dst.stream.getAudioTracks()[0];
    return Object.assign(track, { enabled: false });
  }

  createEmptyVideoTrack({ width, height }) {
    const canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });

    let canvasContext = canvas.getContext("2d");
    canvasContext.fillStyle = "#444";
    canvasContext.fillRect(0, 0, width, height);
    canvasContext.fillStyle = "#C82333";
    canvasContext.font = "250px Comic Sans MS";
    canvasContext.fillText("?", canvas.width / 2 - 60, canvas.height / 2 + 80);

    const stream = canvas.captureStream();
    const track = stream.getVideoTracks()[0];

    return Object.assign(track, { enabled: true });
  }
}
