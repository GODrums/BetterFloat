(function () {
  var OrigWebSocket = window.WebSocket;

  var callWebSocket = OrigWebSocket.apply.bind(OrigWebSocket);
  var wsAddListener = OrigWebSocket.prototype.addEventListener;
  wsAddListener = wsAddListener.call.bind(wsAddListener);
  window.WebSocket = function WebSocket(url, protocols) {
    var ws;
    if (!(this instanceof WebSocket)) {
      // Called without 'new' (browsers will throw an error).
      ws = callWebSocket(this, arguments);
    } else if (arguments.length === 1) {
      ws = new OrigWebSocket(url);
    } else if (arguments.length >= 2) {
      ws = new OrigWebSocket(url, protocols);
    } else { // No arguments (browsers will throw an error)
      ws = new OrigWebSocket();
    }

    wsAddListener(ws, 'message', function (event) {
      console.log("Received:", event);
    });
    wsAddListener(ws, 'open', function (event) {
      console.log("Open:", event);
    });
    wsAddListener(ws, 'close', function (event) {
      console.log("Close:", event);
    });
    wsAddListener(ws, 'error', function (event) {
      console.log("Error:", event);
    });
    return ws;
  }.bind();
  window.WebSocket.prototype = OrigWebSocket.prototype;
  window.WebSocket.prototype.constructor = window.WebSocket;

  var wsSend = OrigWebSocket.prototype.send;
  wsSend = wsSend.apply.bind(wsSend);
  OrigWebSocket.prototype.send = function (data) {
    console.log("Sent:", data);
    return wsSend(this, arguments);
  };
})();