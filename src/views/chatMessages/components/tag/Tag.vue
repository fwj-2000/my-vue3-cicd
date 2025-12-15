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
.tag {
  display: inline-block;
  padding: 2px 10px;
  background-color: #e8f3ff;
  color: #1989fa;
  border: 1px solid #c6e1ff;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #d6eaff;
    border-color: #1989fa;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(25, 137, 250, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>