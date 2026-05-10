import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient = null;

export const connectWebSocket = (onMessageReceived) => {
  const socket = new SockJS("http://localhost:7973";/ws"); // backend endpoint
  stompClient = new Client({
    webSocketFactory: () => socket,
    debug: (str) => console.log(str),
    reconnectDelay: 5000,
    onConnect: () => {
      console.log("Connected to WebSocket!");
      stompClient.subscribe("/topic/driver-locations", (message) => {
        const data = JSON.parse(message.body);
        onMessageReceived(data);
      });
    },
  });

  stompClient.activate();
};

export const sendLocation = (location) => {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: "/app/driver-location",
      body: JSON.stringify(location),
    });
  }
};