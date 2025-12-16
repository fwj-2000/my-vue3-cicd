<template>
  <span class="tag" @click="handleClick">
    {{ tag }}
  </span>
</template>

<script setup>
const props = defineProps({
  tag: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['click']);

const handleClick = () => {
  emit('click', props.tag);
};
</script>

<style scoped lang="less">
@import '@/assets/styles/variables.less';

.tag {
  display: inline-block;
  padding: 3px 12px;
  background-color: #e8f3ff;
  color: @primary-color;
  border: 1px solid #c6e1ff;
  border-radius: 16px;
  font-size: @font-size-xs;
  font-family: @font-family;
  cursor: pointer;
  transition: all @transition-base;
  line-height: 1.4;
  user-select: none;

  &:hover {
    background-color: #d6eaff;
    border-color: @primary-color;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(25, 137, 250, 0.2);
    transition: all @transition-fast;
  }

  // 适应不同背景色的消息气泡
  :deep(.user-message) & {
    background-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
    border-color: rgba(255, 255, 255, 0.3);
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
      box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
    }
    
    &:active {
      box-shadow: 0 2px 8px rgba(255, 255, 255, 0.15);
    }
  }
}
</style>