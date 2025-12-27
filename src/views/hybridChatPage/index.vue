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
      <div class="message-video">
        <video
          style="width: 100%; height: 100%"
          :src="videoUrl"
          autoplay
          preload="auto"
          muted
          loop
          controls
          playsinline
        />
      </div>
      <!-- <VideoMessage width="100%" :content="videoUrl" /> -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import DigitalHuman from "../digitalHuman/index.vue";
import ChatMessages from "../chatMessages/index.vue";
import { usePolling } from "../../hooks/usePolling";
// import VideoMessage from "@/views/chatMessages/components/content/VideoMessage.vue";

defineOptions({
  name: "hybridChatPage",
});
// 直接使用相对路径引用视频资源
const videoUrl = "/src/assets/image/movie.mp4";

// 轮询配置
const wsUrl = "/api/json"; // 使用代理地址，避免跨域问题
const streamUrl = ref(
  `${import.meta.env.VITE_STREAM_BASE_URL}/video_feed.mjpeg`
);
// 使用轮询 hooks
const { connectionStatus, connectionStatusText, messages, addMessage } =
  usePolling(wsUrl, {
    pollingInterval: 1000,
    reconnectInterval: 3000,
    mock: true, // 启用模拟模式
  });

// 组件挂载时添加模拟消息用于测试
onMounted(() => {});
</script>

<style lang="less" scoped>
@import "@/assets/styles/variables.less";

.hybrid-chat-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
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
  background-color: @chat-bg; /* 白色半透明，透明度可调整（0.3为30%透明） */
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
  .message-video {
    // width: 100%;
    // height: 100%;
  }
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
