<template>
  <div class="message-content text-content">
    {{ content }}
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
.text-content {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 4px;
  word-wrap: break-word;
  word-break: break-word;
}
</style>