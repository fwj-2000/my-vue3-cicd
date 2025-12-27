<template>
  <div class="message-content text-content">
    {{ displayedContent }}
    <span v-if="isTyping" class="typing-cursor">|</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  enableTyping: {
    type: Boolean,
    default: true, // 默认启用打字机效果
  },
  typingSpeed: {
    type: Number,
    default: 30, // 打字速度，毫秒/字符
  },
});

const displayedContent = ref('');
const isTyping = ref(false);
let typingTimer = null;

// 打字机效果
const typeText = () => {
  // 如果不需要打字效果，直接显示完整内容
  if (!props.enableTyping) {
    displayedContent.value = props.content;
    return;
  }
  
  isTyping.value = true;
  let index = 0;
  displayedContent.value = '';
  
  // 清除之前的定时器
  if (typingTimer) {
    clearInterval(typingTimer);
  }
  
  typingTimer = setInterval(() => {
    if (index < props.content.length) {
      displayedContent.value += props.content.charAt(index);
      index++;
    } else {
      clearInterval(typingTimer);
      typingTimer = null;
      isTyping.value = false;
    }
  }, props.typingSpeed);
};

// 组件挂载时开始打字
onMounted(() => {
  typeText();
});

// 组件卸载前清除定时器
onBeforeUnmount(() => {
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }
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
  position: relative;
}

// 打字光标样式
.typing-cursor {
  display: inline-block;
  width: 10px;
  height: 18px;
  background-color: inherit;
  margin-left: 2px;
  vertical-align: middle;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>