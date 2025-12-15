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

<style lang="less" scoped>
.chat-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  height: 100%;

  // 对话消息列表
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background-color: #fafafa;
  }
}
</style>
