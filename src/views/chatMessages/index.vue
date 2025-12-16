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
import { ref, watch } from "vue";
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

// 消息容器引用，用于自动滚动
const messagesContainer = ref(null);

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
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
