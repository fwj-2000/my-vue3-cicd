<template>
  <div class="message-content video-content">
    <video
      :src="content"
      autoplay
      preload="auto"
      muted
      loop
      controls
      playsinline
      class="message-video"
      @error="handleVideoError"
    >
      您的浏览器不支持视频播放
    </video>
    <div v-if="videoError" class="video-error">
      视频播放错误: {{ videoError }}
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
});

const videoError = ref("");

// 处理视频播放错误
const handleVideoError = (event) => {
  console.error("Video error:", event.target.error);
  videoError.value = event.target.error.message || "未知错误";
};

// 调试信息
</script>

<style scoped lang="less">
.video-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
}

.message-video {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
}

.video-error {
  margin-top: 8px;
  color: #dc3545;
  font-size: 14px;
}
</style>
