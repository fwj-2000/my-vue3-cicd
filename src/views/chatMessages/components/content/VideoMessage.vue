<template>
  <div class="message-content video-content">
    <video
      :src="content"
      autoplay
      controls
      class="message-video"
    >
      您的浏览器不支持视频播放
    </video>
  </div>
</template>

<script setup>
const props = defineProps({
  content: {
    type: String,
    required: true,
  },
});
</script>

<style scoped lang="less">
.video-content {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.message-video {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
}
</style>