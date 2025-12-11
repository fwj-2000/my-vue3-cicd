<template>
  <div class="chat-area">
    <!-- 连接状态提示 -->
    <div class="connection-status" :class="{ 'connected': connectionStatus === 'connected', 'disconnected': connectionStatus === 'disconnected', 'connecting': connectionStatus === 'connecting' }">
      {{ connectionStatusText }}
    </div>
    
    <!-- 对话消息列表 -->
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="(message, index) in messages" 
        :key="index"
        class="message-item"
        :class="message.sender === 'user' ? 'user-message' : 'assistant-message'"
      >
        <div class="message-bubble">
          <div class="message-content">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// Props
const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  connectionStatus: {
    type: String,
    default: 'disconnected' // connected, disconnected, connecting
  },
  connectionStatusText: {
    type: String,
    default: '未连接'
  }
});

// 消息容器引用，用于自动滚动
const messagesContainer = ref(null);

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 监听消息变化，自动滚动到底部
watch(() => props.messages, () => {
  // 使用setTimeout确保DOM已更新
  setTimeout(() => {
    scrollToBottom();
  }, 0);
}, { deep: true });
</script>

<style lang="less" scoped>
.chat-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  height: 100%;
  
  // 连接状态提示
  .connection-status {
    padding: 8px 16px;
    font-size: 12px;
    text-align: center;
    background-color: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
    
    &.connected {
      background-color: #e8f5e8;
      color: #2e7d32;
    }
    
    &.disconnected {
      background-color: #ffebee;
      color: #c62828;
    }
    
    &.connecting {
      background-color: #fff3e0;
      color: #ef6c00;
    }
  }
  
  // 对话消息列表
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background-color: #fafafa;
    
    // 消息项
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
        }
      }
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