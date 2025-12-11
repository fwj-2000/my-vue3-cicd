import { ref, onMounted, onBeforeUnmount } from 'vue';

/**
 * WebSocket hooks，用于管理WebSocket连接、消息接收、心跳保活和重连机制
 * @param {string} url - WebSocket服务器地址
 * @param {Object} options - 配置选项
 * @param {number} options.reconnectInterval - 重连间隔（毫秒）
 * @param {number} options.heartbeatInterval - 心跳间隔（毫秒）
 * @returns {Object} WebSocket状态和方法
 */
export function useWebSocket(url, options = {}) {
  // 默认配置
  const defaultOptions = {
    reconnectInterval: 5000,
    heartbeatInterval: 30000
  };
  
  const { reconnectInterval, heartbeatInterval } = { ...defaultOptions, ...options };
  
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
      ws = new WebSocket(url);
      
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