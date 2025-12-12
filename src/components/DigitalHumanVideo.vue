<template>
  <div class="digital-human-area">
    <div class="digital-human-header">
      <h3>数字人</h3>
      <div class="stream-status" :class="streamStatus">
        {{ streamStatusText }}
      </div>
    </div>

    <div class="digital-human-container">
      <!-- 数字人流播放容器 -->
      <img
        id="video"
        v-if="streamUrl"
        :src="streamUrl"
        width="640"
        height="480"
        alt="摄像头视频流"
      />
      <!-- <video 
        v-if="streamUrl" 
        ref="videoRef"
        class="digital-human-video"
        autoplay 
        muted 
        playsinline
        @play="onStreamPlay"
        @pause="onStreamPause"
        @error="onStreamError"
      >
        <source :src="streamUrl" type="video/mp4">
        您的浏览器不支持视频播放
      </video> -->

      <!-- 加载状态 -->
      <div v-else class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ streamStatusText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from "vue";

// Props
const props = defineProps({
  streamUrl: {
    type: String,
    default: "",
  },
});

// 流状态管理
const streamStatus = ref("loading"); // loading, playing, paused, error
const streamStatusText = ref("数字人流加载中...");
const videoRef = ref(null);

// 数字人流事件处理
const onStreamPlay = () => {
  streamStatus.value = "playing";
  streamStatusText.value = "播放中";
};

const onStreamPause = () => {
  streamStatus.value = "paused";
  streamStatusText.value = "已暂停";
};

const onStreamError = () => {
  streamStatus.value = "error";
  streamStatusText.value = "流播放错误";
};

// 组件卸载前停止视频播放
onBeforeUnmount(() => {
  if (videoRef.value) {
    videoRef.value.pause();
    videoRef.value.src = "";
  }
});
</script>

<style lang="less" scoped>
.digital-human-area {
  width: 100%;
  background-color: #000;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
  height: 100%;

  // 数字人流头部
  .digital-human-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: rgba(0, 0, 0, 0.8);
    color: #fff;
    border-bottom: 1px solid #333;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    // 流状态
    .stream-status {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 12px;
      background-color: rgba(255, 255, 255, 0.2);

      &.loading {
        background-color: rgba(255, 193, 7, 0.3);
        color: #ffc107;
      }

      &.playing {
        background-color: rgba(40, 167, 69, 0.3);
        color: #28a745;
      }

      &.paused {
        background-color: rgba(108, 117, 125, 0.3);
        color: #6c757d;
      }

      &.error {
        background-color: rgba(220, 53, 69, 0.3);
        color: #dc3545;
      }
    }
  }

  // 数字人流容器
  .digital-human-container {
    width: 100%;
    height: calc(100% - 50px);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background-color: #000;

    // 视频播放
    .digital-human-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    // 加载状态
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 12px;
      }

      .loading-text {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
}

// 加载动画
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
