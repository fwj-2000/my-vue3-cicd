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
@import '@/assets/styles/variables.less';

.text-content {
  font-size: @font-size-base;
  line-height: @line-height-lg;
  margin-bottom: @spacing-xs;
  word-wrap: break-word;
  word-break: break-word;
  font-family: @font-family;
  color: inherit; // 继承父元素颜色
}
</style>