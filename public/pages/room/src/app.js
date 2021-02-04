const onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get("room");

  // const socketUrl = "http://localhost:3000";
  const socketUrl = "https://immense-refuge-56981.herokuapp.com";
  const socketBuilder = new SocketBuilder({ socketUrl });

  const peerConfig = Object.values({
    id: undefined,
    config: {
      // port: 9000,
      // host: "localhost",
      port: 443,
      host: "s867g1s37sas.herokuapp.com",
      secure: true,
      path: "/",
    },
  });
  const peerBuilder = new PeerBuilder({ peerConfig });

  const view = new View();
  const media = new Media();

  const deps = {
    view,
    media,
    room,
    socketBuilder,
    peerBuilder,
  };

  Business.initialize(deps);
};

window.onload = onload;
