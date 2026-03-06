/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import ChatWidget from "nexus-chat-widget";
import { v4 as uuidv4 } from 'uuid';

export default function ChatWidgetWrapper() {
    const userData = localStorage.getItem("user");
    const user = JSON.parse(userData || "{}");

    const sessionId = uuidv4();


  useEffect(() => {
    const chatWidget = new ChatWidget({
      title: 'Jagedo Assistant',
      appToken: import.meta.env.VITE_NEXUS_KEY,
      sessionId: user.id || sessionId,
      botAvatar: "../../assets/chatbot.png"
    });

    // Optional: Send a welcome message
    chatWidget.addBotMessage("Hello! How can I assist you today?");

    // Cleanup function
    return () => {
      chatWidget.destroy();
    };
  }, []);

  return null;
}