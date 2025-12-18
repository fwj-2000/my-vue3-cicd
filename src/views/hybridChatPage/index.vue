<template>
  <div class="hybrid-chat-container">
    <!-- 左侧区域：数字人 + 聊天 -->
    <div class="left-section">
      <!-- 数字人区域 -->
      <div class="digital-human-container">
        <DigitalHuman :stream-url="streamUrl" />
      </div>

      <!-- 聊天区域（漂浮在数字人上方） -->
      <div class="chat-float-container">
        <ChatMessages
          :messages="messages"
          :connection-status="connectionStatus"
          :connection-status-text="connectionStatusText"
        />
      </div>
    </div>

    <!-- 右侧区域：空白占位 -->
    <div class="right-section">
      <div class="placeholder-content">
        <div class="placeholder-text">空白区域</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import DigitalHuman from "../digitalHuman/index.vue";
import ChatMessages from "../chatMessages/index.vue";
import { usePolling } from "../../hooks/usePolling";

defineOptions({
  name: "hybridChatPage",
});

// 轮询配置
const wsUrl = "http://localhost:8080"; // 轮询服务器地址，实际使用时需要替换
const streamUrl = ref("http://10.16.17.225:9090/video_feed"); // 数字人流地址，实际使用时需要替换

// 使用轮询 hooks
const { connectionStatus, connectionStatusText, messages, addMessage } =
  usePolling(wsUrl, {
    pollingInterval: 1000,
    reconnectInterval: 3000,
    // mock: true, // 启用模拟模式
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
.hybrid-chat-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #f5f5f5;
}

/* 左侧区域 */
.left-section {
  width: 35%;
  position: relative;
  background-color: #000;
  overflow: hidden;
}

/* 数字人容器 */
.digital-human-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 聊天区域（漂浮） */
.chat-float-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40%; /* 可自定义高度 */
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.3);
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 10;
}

/* 右侧区域：空白占位 */
.right-section {
  width: 65%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 空白区域内容 */
.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
}

.placeholder-text {
  font-size: 24px;
  color: #999;
  font-weight: 300;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hybrid-chat-container {
    flex-direction: column;
  }

  .left-section,
  .right-section {
    width: 100%;
    height: 50%;
  }

  .chat-float-container {
    height: 40%;
  }
}
</style>
