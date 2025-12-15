<template>
  <div class="chat-container">
    <!-- 左侧数字人组件（4成） -->
    <div class="digital-human-section">
      <DigitalHuman :stream-url="streamUrl" />
    </div>

    <!-- 右侧对话组件（6成） -->
    <div class="chat-section">
      <ChatMessages
        :messages="messages"
        :connection-status="connectionStatus"
        :connection-status-text="connectionStatusText"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import DigitalHuman from "../digitalHuman/index.vue";
import ChatMessages from "../chatMessages/index.vue";
import { useWebSocket } from "../../hooks/useWebSocket";
defineOptions({
  name: "chatPage",
});
// WebSocket配置
const wsUrl = "ws://localhost:8080"; // WebSocket服务器地址，实际使用时需要替换
const streamUrl = ref("http://10.16.17.225:9090/video_feed"); // 数字人流地址，实际使用时需要替换

// 使用WebSocket hooks
const { connectionStatus, connectionStatusText, messages, addMessage } = useWebSocket(wsUrl, {
  reconnectInterval: 5000,
  heartbeatInterval: 10000,
  mock: true, // 启用模拟模式
});

// 组件挂载时添加模拟消息用于测试
onMounted(() => {
  // 模拟两条初始消息，用于测试
  // addMessage("user", "你好，我想了解一下这个项目");
  // addMessage(
  //   "assistant",
  //   "你好！我是智能助手，很高兴为你服务。请问你想了解项目的哪些方面？"
  // );
});
</script>

<style lang="less" scoped>
.chat-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;

  .digital-human-section {
    width: 40%;
    height: 100%;
  }

  .chat-section {
    width: 60%;
    height: 100%;
  }
}
</style>