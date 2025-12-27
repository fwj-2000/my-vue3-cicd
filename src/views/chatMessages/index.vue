<template>
  <div class="chat-area">
    <!-- 连接状态提示 -->
    <ConnectionStatus
      :status="connectionStatus"
      :status-text="connectionStatusText"
    />

    <!-- 对话消息列表 -->
    <div class="chat-messages" ref="messagesContainer">
      <MessageItem
        v-for="(message, index) in messages"
        :key="index"
        :message="message"
        @tag-click="handleTagClick"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import ConnectionStatus from "./components/ConnectionStatus.vue";
import MessageItem from "./components/MessageItem.vue";

// Props
const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
  connectionStatus: {
    type: String,
    default: "disconnected", // connected, disconnected, connecting
  },
  connectionStatusText: {
    type: String,
    default: "未连接",
  },
});

const emit = defineEmits(["tag-click"]);
// - 用户手动滚动时，自动滚动立即暂停
// - ✅ 用户可以自由查看历史消息，不会被强制滚动到底部
// - ✅ 只有当用户滚动到底部附近时，才会恢复自动滚动
// - ✅ 简化了滚动逻辑，提高了性能

// 消息容器引用，用于自动滚动
const messagesContainer = ref(null);
let scrollTimer = null;
let isUserScrolling = false;
let lastScrollTime = 0;
const USER_SCROLL_DEBOUNCE = 2000; // 用户滚动后，暂停自动滚动2秒

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value && !isUserScrolling) {
    const container = messagesContainer.value;
    container.scrollTop = container.scrollHeight;
  }
};

// 监听滚动事件，判断用户是否在手动滚动
const handleScroll = () => {
  if (messagesContainer.value) {
    const container = messagesContainer.value;

    // 检测用户是否手动滚动（距离底部超过100px）
    const isNearBottom =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 10;

    if (!isNearBottom) {
      // 用户手动滚动离开底部区域
      isUserScrolling = true;
      lastScrollTime = Date.now();

      // 设置定时器，2秒后自动恢复滚动
      setTimeout(() => {
        // 检查当前是否仍然不在底部
        const stillNotAtBottom =
          container.scrollTop + container.clientHeight <
          container.scrollHeight - 50;
        if (stillNotAtBottom) {
          // 用户仍然不在底部，保持手动滚动状态
          isUserScrolling = true;
        } else {
          // 用户已经滚动到底部附近，恢复自动滚动
          isUserScrolling = false;
        }
      }, USER_SCROLL_DEBOUNCE);
    } else {
      // 用户滚动到底部附近，恢复自动滚动
      isUserScrolling = false;
    }
  }
};

// 监听消息变化，自动滚动到底部
watch(
  () => props.messages,
  () => {
    // 使用setTimeout确保DOM已更新
    setTimeout(() => {
      scrollToBottom();
    }, 0);
  },
  { deep: true }
);

// 处理标签点击事件
const handleTagClick = (tag) => {
  emit("tag-click", tag);
};

// 组件挂载时添加定时器和滚动事件监听
onMounted(() => {
  // 添加滚动事件监听
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener("scroll", handleScroll);
  }

  // 添加定时器，定期检查并滚动到底部（用于流式输出）
  scrollTimer = setInterval(() => {
    scrollToBottom();
  }, 200); // 每200毫秒检查一次，减少触发频率
});

// 组件卸载前清除定时器和事件监听
onBeforeUnmount(() => {
  // 清除定时器
  if (scrollTimer) {
    clearInterval(scrollTimer);
    scrollTimer = null;
  }

  // 清除滚动事件监听
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener("scroll", handleScroll);
  }
});
</script>

<style scoped lang="less">
@import "@/assets/styles/variables.less";

.chat-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: @chat-bg;
  height: 100%;
  font-family: @font-family;

  // 对话消息列表
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: @spacing-md;
    background-color: @chat-bg;
    scroll-behavior: smooth;

    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: @light-border;
      border-radius: @radius-sm;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: @radius-sm;

      &:hover {
        background: #a8a8a8;
      }
    }

    &::-webkit-scrollbar-corner {
      background: @light-border;
    }
  }
}
</style>
