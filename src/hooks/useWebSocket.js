import { ref, onMounted, onBeforeUnmount } from 'vue';

/**
 * WebSocket hooks，用于管理WebSocket连接、消息接收、心跳保活和重连机制
 * @param {string} url - WebSocket服务器地址
 * @param {Object} options - 配置选项
 * @param {number} options.reconnectInterval - 重连间隔（毫秒）
 * @param {number} options.heartbeatInterval - 心跳间隔（毫秒）
 * @returns {Object} WebSocket状态和方法
 */
export const useWebSocket = (url, options = {}) => {
  // 默认配置
  const defaultOptions = {
    reconnectInterval: 5000,
    heartbeatInterval: 30000,
    mock: false // 新增：是否启用模拟模式·
  };

  const { reconnectInterval, heartbeatInterval, mock } = { ...defaultOptions, ...options };

  // 状态管理
  const connectionStatus = ref('disconnected'); // connected, disconnected, connecting
  const connectionStatusText = ref('未连接');
  const messages = ref([]);

  let ws = null;
  let heartbeatTimer = null;
  let reconnectTimer = null;

  // 初始化WebSocket连接
  const initWebSocket = () => {
    connectionStatus.value = 'connecting';
    connectionStatusText.value = '连接中...';

    try {
      if (mock) {
        // 使用模拟WebSocket
        ws = new MockWebSocket(url);
      } else {
        // 使用真实WebSocket
        ws = new WebSocket(url);
      }
      // 连接成功
      ws.onopen = () => {
        console.log('WebSocket连接成功');
        connectionStatus.value = 'connected';
        connectionStatusText.value = '已连接';
        startHeartbeat();
      };

      // 接收消息
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('收到消息:', message);

          // 处理心跳消息
          if (message.type === 'heartbeat') {
            return;
          }

          // 处理对话消息
          if (message.type === 'message') {
            addMessage(message.sender, message.content);
          }
        } catch (error) {
          console.error('消息解析失败:', error);
        }
      };

      // 连接关闭
      ws.onclose = () => {
        console.log('WebSocket连接关闭');
        connectionStatus.value = 'disconnected';
        connectionStatusText.value = '已断开连接，正在尝试重连...';
        stopHeartbeat();
        startReconnect();
      };

      // 连接错误
      ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        connectionStatus.value = 'disconnected';
        connectionStatusText.value = '连接错误，正在尝试重连...';
        stopHeartbeat();
      };
    } catch (error) {
      console.error('WebSocket初始化失败:', error);
      connectionStatus.value = 'disconnected';
      connectionStatusText.value = '初始化失败，正在尝试重连...';
      startReconnect();
    }
  };

  // 添加消息到对话列表
  const addMessage = (sender, content) => {
    const message = {
      sender, // user 或 assistant
      content,
      timestamp: Date.now()
    };
    messages.value.push(message);
  };

  // 发送消息
  const sendMessage = (message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket未连接，无法发送消息');
    }
  };

  // 发送心跳
  const sendHeartbeat = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'heartbeat' }));
    }
  };

  // 开始心跳
  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, heartbeatInterval);
  };

  // 停止心跳
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  // 开始重连
  const startReconnect = () => {
    stopReconnect();
    reconnectTimer = setTimeout(initWebSocket, reconnectInterval);
  };

  // 停止重连
  const stopReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  // 关闭WebSocket连接
  const closeWebSocket = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    stopHeartbeat();
    stopReconnect();
  };

  // 组件挂载时初始化WebSocket
  onMounted(() => {
    initWebSocket();
  });

  // 组件卸载前关闭WebSocket
  onBeforeUnmount(() => {
    closeWebSocket();
  });

  return {
    connectionStatus,
    connectionStatusText,
    messages,
    sendMessage,
    addMessage,
    closeWebSocket,
    initWebSocket
  };
}
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;

    // 模拟连接成功
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
      this.startMockMessages();
    }, 1000);
  }

  // 模拟消息生成
  startMockMessages () {
    // 模拟发送方消息
    const mockMessages = [
      { sender: 'user', content: '你好，我想了解这个项目' },
      { sender: 'assistant', content: '你好！我是智能助手，很高兴为你服务' },
      { sender: 'user', content: '项目的主要功能是什么？' },
      { sender: 'assistant', content: '我们的项目是一个智能聊天系统，支持实时对话和数字人交互' },
      { sender: 'user', content: '如何使用这个系统？' },
      { sender: 'assistant', content: '你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流' },
      { sender: 'user', content: '你好，我想了解这个项目' },
      { sender: 'assistant', content: '你好！我是智能助手，很高兴为你服务' },
      { sender: 'user', content: '项目的主要功能是什么？' },
      { sender: 'assistant', content: '我们的项目是一个智能聊天系统，支持实时对话和数字人交互' },
      { sender: 'user', content: '如何使用这个系统？' },
      { sender: 'assistant', content: '你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流' },
    ];

    // 定时发送模拟消息
    let index = 0;
    const interval = setInterval(() => {
      if (index >= mockMessages.length) {
        clearInterval(interval);
        return;
      }

      const mockMsg = mockMessages[index++];
      const message = {
        type: 'message',
        ...mockMsg,
        timestamp: Date.now()
      };

      if (this.onmessage) {
        this.onmessage({ data: JSON.stringify(message) });
      }
    }, 2000);
  }

  // 模拟发送消息
  send (data) {
    if (this.readyState === WebSocket.OPEN) {
      console.log('发送消息:', data);
      // 这里可以添加模拟回复逻辑
    }
  }

  // 模拟关闭连接
  close () {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }
}