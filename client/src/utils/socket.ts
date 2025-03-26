import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

// 创建Websocket连接
export const getSocket = (): Socket => {
  if (!socket) {
    // 根据环境确定WebSocket连接地址
    const socketUrl = "ws://localhost:3001";

    console.log("socketUrl", socketUrl);
    socket = io(`${socketUrl}/chat`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      path: "/socket.io",
    });

    // 连接事件监听
    socket.on("connect", () => {
      console.log("Socket连接成功");
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket断开连接: ${reason}`);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket连接错误:", error);
      // 尝试重新连接
      if (!socket?.connected) {
        setTimeout(() => {
          socket?.connect();
        }, 1000);
      }
    });

    // 添加重连事件监听
    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`尝试重新连接 (${attemptNumber})`);
    });

    socket.on("reconnect", () => {
      console.log("重新连接成功");
    });

    socket.on("reconnect_error", (error) => {
      console.error("重新连接错误:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error("重新连接失败");
    });
  }

  return socket;
};

// 关闭Websocket连接
export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
