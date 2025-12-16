<template>
  <div class="tagList">
    <Tag
      v-for="(tag, index) in tags"
      :key="index"
      :tag="tag"
      @click="handleTagClick"
    />
  </div>
</template>

<script setup>
import Tag from "./Tag.vue";

const props = defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['tag-click']);

const handleTagClick = (tag) => {
  emit('tag-click', tag);
};
</script>

<style scoped lang="less">
@import '@/assets/styles/variables.less';

.tagList {
  display: flex;
  flex-wrap: wrap;
  gap: @spacing-sm;
  margin-top: @spacing-sm;
  padding-top: @spacing-xs;
  border-top: 1px solid @light-border;
  
  // 适应不同背景色的消息气泡
  :deep(.user-message) & {
    border-top-color: rgba(255, 255, 255, 0.2);
  }
}
</style>