<template>
  <div class="message-content image-content">
    <img :src="content" alt="图片" class="message-image" />
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
.image-content {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.message-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  object-fit: contain;
}
</style>