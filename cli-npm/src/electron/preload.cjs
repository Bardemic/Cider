const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ciderSimulator", {
  init: () => ipcRenderer.invoke("simulator:init"),
  refreshFrame: () => ipcRenderer.invoke("simulator:refresh-frame"),
  tap: (x, y) => ipcRenderer.invoke("simulator:tap", x, y),
  swipe: (startX, startY, endX, endY, duration) =>
    ipcRenderer.invoke("simulator:swipe", startX, startY, endX, endY, duration),
  inputText: (text) => ipcRenderer.invoke("simulator:text", text),
  getStreamUrl: () => ipcRenderer.invoke("simulator:stream-url"),
});
