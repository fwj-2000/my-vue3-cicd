<template>
  <div
    class="message-item"
    :class="message.sender === 'user' ? 'user-message' : 'assistant-message'"
  >
    <div class="message-bubble">
      <!-- 数字人思考中状态 -->
      <div v-if="message.isThinking" class="thinking-state">
        <span class="thinking-text">数字人思考中</span>
        <span class="thinking-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </div>

      <!-- 文本消息 -->
      <TextMessage
        v-else-if="message.contentType === 'text'"
        :content="message.content"
        :enable-typing="message.sender === 'assistant'"
        :typing-speed="50"
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

const emit = defineEmits(["tag-click"]);

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const handleTagClick = (tag) => {
  emit("tag-click", tag);
};
</script>

<style scoped lang="less">
@import "@/assets/styles/variables.less";

.message-item {
  display: flex;
  margin-bottom: @message-margin-bottom;
  animation: slideIn 0.3s ease-out forwards;
  opacity: 0;
  transform: translateY(10px);
  font-family: @font-family;

  // 交错动画效果
  &:nth-child(odd) {
    animation-delay: 0.05s;
  }

  // 用户消息（右侧）
  &.user-message {
    justify-content: flex-end;

    .message-bubble {
      background-color: @primary-color;
      opacity: @opacity-disabled;
      color: #fff;
      border-radius: @radius-xl @radius-xl @radius-sm @radius-xl;
      margin-right: 0;
      margin-left: auto;
      box-shadow: 0 2px 8px rgba(25, 137, 250, 0.3);
    }

    .message-time {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  // 助手消息（左侧）
  &.assistant-message {
    justify-content: flex-start;

    .message-bubble {
      background-color: @bubble-bg;
      opacity: @opacity-disabled;
      color: @text-color;
      border-radius: @radius-xl @radius-xl @radius-xl @radius-sm;
      border: 1px solid @border-color;
      margin-right: auto;
      margin-left: 0;
      box-shadow: @shadow-sm;
    }

    .message-time {
      color: @light-text;
    }
  }

  // 消息气泡
  .message-bubble {
    max-width: @message-max-width;
    padding: @message-padding;
    transition: box-shadow @transition-base;

    &:hover {
      box-shadow: @shadow-md;
    }

    // 消息内容
    .message-content {
      font-size: @font-size-xs;
      line-height: @line-height-lg;
      margin-bottom: @spacing-xs;
      word-wrap: break-word;
      word-break: break-word;
    }

    // 消息时间
    .message-time {
      font-size: @font-size-mxs;
      opacity: 0.7;
      text-align: right;
      margin-top: @spacing-xs;
    }
  }
}

// 消息滑入动画
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 数字人思考中状态样式
.thinking-state {
  display: flex;
  align-items: center;
  // gap: 8px;
  // padding: 8px 0;

  .thinking-text {
    font-size: @font-size-xs;
    color: inherit;
  }

  .thinking-dots {
    display: flex;
    align-items: center;
    gap: 2px;

    span {
      display: inline-block;
      width: 6px;
      height: 6px;
      background-color: inherit;
      border-radius: 50%;
      animation: dotPulse 1.5s infinite ease-in-out;

      &:nth-child(2) {
        animation-delay: 0.2s;
      }

      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
}

// 思考点动画
@keyframes dotPulse {
  0%,
  60%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  30% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
