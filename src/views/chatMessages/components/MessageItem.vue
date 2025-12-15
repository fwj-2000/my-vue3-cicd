<template>
  <div
    class="message-item"
    :class="message.sender === 'user' ? 'user-message' : 'assistant-message'"
  >
    <div class="message-bubble">
      <!-- 文本消息 -->
      <TextMessage
        v-if="message.contentType === 'text'"
        :content="message.content"
      />

      <!-- 图片消息 -->
      <ImageMessage
        v-else-if="message.contentType === 'image'"
        :content="message.content"
      />

      <!-- 视频消息 -->
      <VideoMessage
        v-else-if="message.contentType === 'video'"
        :content="message.content"
      />

      <!-- 其他类型消息 -->
      <div v-else class="message-content">
        {{ message.content }}
      </div>

      <div class="message-time">{{ formatTime(message.timestamp) }}</div>

      <!-- 标签列表 -->
      <TagList
        v-if="message.contentList && message.contentList.length > 0"
        :tags="message.contentList"
        @tag-click="handleTagClick"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import TextMessage from "./content/TextMessage.vue";
import ImageMessage from "./content/ImageMessage.vue";
import VideoMessage from "./content/VideoMessage.vue";
import TagList from "./tag/TagList.vue";

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['tag-click']);

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const handleTagClick = (tag) => {
  emit('tag-click', tag);
};
</script>

<style scoped lang="less">
.message-item {
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;

  // 用户消息（右侧）
  &.user-message {
    justify-content: flex-end;

    .message-bubble {
      background-color: #1989fa;
      color: #fff;
      border-radius: 18px 18px 4px 18px;
      margin-right: 0;
      margin-left: auto;
    }
  }

  // 助手消息（左侧）
  &.assistant-message {
    justify-content: flex-start;

    .message-bubble {
      background-color: #fff;
      color: #333;
      border-radius: 18px 18px 18px 4px;
      border: 1px solid #e0e0e0;
      margin-right: auto;
      margin-left: 0;
    }
  }

  // 消息气泡
  .message-bubble {
    max-width: 70%;
    padding: 12px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    // 消息内容
    .message-content {
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 4px;
      word-wrap: break-word;
      word-break: break-word;
    }

    // 消息时间
    .message-time {
      font-size: 11px;
      opacity: 0.7;
      text-align: right;
      // margin-bottom: 8px;
    }
  }
}

// 消息淡入动画
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>