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
.tagList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
</style>