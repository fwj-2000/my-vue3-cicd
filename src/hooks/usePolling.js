import { ref, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';

/**
* 使用axios进行定期轮询的hooks，用于替代WebSocket
*
* @param {string} url - 轮询服务器地址
* @param {Object} options - 配置选项
* @param {number} options.pollingInterval - 轮询间隔（毫秒）
* @param {number} options.reconnectInterval - 重连间隔（毫秒）
* @param {number} options.timeout - 请求超时时间（毫秒）
* @param {boolean} options.mock - 是否启用模拟模式
* @returns {Object} 轮询状态和方法，与useWebSocket相同的API
*/
export const usePolling = (url, options = {}) => {
  // 默认配置
  const defaultOptions = {
    pollingInterval: 3000, // 默认3秒轮询一次
    reconnectInterval: 5000, // 默认5秒后重连
    timeout: 10000, // 默认10秒超时
    mock: false // 默认不使用模拟模式
  };

  // 合并默认配置和用户传入的配置
  const { pollingInterval, reconnectInterval, timeout, mock } = { ...defaultOptions, ...options };

  // 状态管理
  const connectionStatus = ref('disconnected'); // disconnected, connecting, connected
  const connectionStatusText = ref('未连接');
  const messages = ref([]);

  // 轮询相关变量
  let pollingTimer = null; // 轮询定时器
  let reconnectTimer = null; // 重连定时器
  let lastMessageId = null; // 上一条消息的ID，用于增量获取
  let isPolling = false; // 标记是否正在执行轮询请求
  let lastResponseData = null; // 上一次请求返回的数据缓存，用于去重

  /**
   * 初始化轮询
   */
  const initPolling = () => {
    // 更新状态：正在连接中
    connectionStatus.value = 'connecting';
    connectionStatusText.value = '连接中...';

    try {
      if (mock) {
        // 使用模拟模式
        console.log('使用模拟轮询模式');
        startMockPolling();
      } else {
        // 使用真实轮询
        console.log('使用真实轮询连接:', url);
        startPolling();
      }
    } catch (error) {
      console.error('轮询初始化失败:', error);
      connectionStatus.value = 'disconnected';
      connectionStatusText.value = '初始化失败，正在尝试重连...';
      startReconnect();
    }
  };

  /**
   * 开始轮询
   */
  const startPolling = () => {
    // 立即执行一次轮询
    poll();

    // 设置定时器，定期轮询
    pollingTimer = setInterval(poll, pollingInterval);
  };

  /**
   * 执行轮询请求
   */
  const poll = async () => {
    // 如果当前正在执行轮询请求，直接返回
    if (isPolling) {
      console.log('上一个轮询请求尚未完成，跳过本次请求');
      return;
    }
    isPolling = true;

    try {
      // 发送GET请求获取消息，添加超时处理
      const response = await axios.get(url, {
        params: {
          lastMessageId: lastMessageId
        },
        timeout: timeout // 添加超时设置
      });
      const { status, data: message } = response
      console.log("🚀 ~ poll ~ status, data:", status, message)//
      //  data: {
      //     "assistant_text": "非常抱歉，该问题小益还未学习，请咨询人工向导或换个问题，谢谢！",
      //     "user_text": "OMM 资 源 和 人 力 资 源 怎 么 样"
      // }

      // 比较当前数据与上一次数据是否一致，一致则跳过处理
      const isDataSame = JSON.stringify(message) === JSON.stringify(lastResponseData);
      if (isDataSame) {
        console.log('轮询数据未变化，跳过处理');
        return;
      }

      if (status === 200) {
        processMessage({ type: "message", ...message })//后端告知固定文本
        // 更新缓存数据
        lastResponseData = message;
      }
      // 处理返回的消息
      // {'assistant_text': text, 'user_text': user_text}

      // if (response.data && Array.isArray(response.data)) {
      //   response.data.forEach(message => {
      //     processMessage(message);
      //   });
      // } else if (response.data && response.data.type) {
      //   // 单个消息处理
      //   processMessage(response.data);
      // }

      // 更新连接状态为已连接
      if (connectionStatus.value !== 'connected') {
        connectionStatus.value = 'connected';
        connectionStatusText.value = '已连接';
      }
    } catch (error) {
      console.error('轮询请求失败:', error);

      // 根据错误类型处理
      if (error.code === 'ECONNABORTED') {
        console.error('轮询请求超时');
        connectionStatusText.value = '请求超时，正在重试...';
      } else {
        connectionStatus.value = 'disconnected';
        connectionStatusText.value = '连接错误，正在尝试重连...';
        stopPolling();
        startReconnect();
      }
    } finally {
      isPolling = false;
    }
  };

  /**
   * 处理接收到的消息
   */
  const processMessage = (message) => {
    switch (message.type) {
      case 'message':
        if (mock) {
          const { sender, content, contentType, timestamp, contentList } = message;
          addMessage(sender, content, contentType, timestamp, contentList);
          lastMessageId = message.id || Date.now();
        } else {
          const { user_text, assistant_text } = message
          if (user_text) {
            addMessage('user', user_text)
          }
          if (assistant_text) {
            addMessage('assistant', assistant_text)
          }
        }
        break;
      case 'heartbeat':
        // 处理心跳消息，无需特殊处理
        console.log('心跳响应，连接正常');
        break;
      case 'stream':
        // 处理数字人流状态消息
        if (message.data) {
          console.log('数字人流状态变化:', message.data.status);
        }
        break;
      default:
        console.warn('未知消息类型:', message.type);
    }
  };

  /**
   * 添加消息到对话列表
   */
  const addMessage = (sender, content, contentType = 'text', timestamp, contentList, isStreaming = true) => {
    // 创建消息对象
    const message = {
      sender,
      content,
      contentType,
      timestamp: timestamp || Date.now(),
      contentList,
      isStreaming: false // 默认非流式
    };

    // 如果是助手消息且需要流式输出
    if (isStreaming && sender === 'assistant') {
      // 先添加完整消息，但标记为非流式
      messages.value.push(message);
    } else {
      // 直接添加消息
      messages.value.push(message);
    }
  };

  /**
   * 发送消息
   */
  const sendMessage = async (message) => {
    try {
      // 使用POST请求发送消息，添加超时处理
      await axios.post(url, message, {
        timeout: timeout
      });
      console.log('消息发送成功:', message);
    } catch (error) {
      console.error('消息发送失败:', error);
      throw error;
    }
  };

  /**
   * 开始模拟轮询
   */
  const startMockPolling = () => {
    // 更新状态为已连接
    connectionStatus.value = 'connected';
    connectionStatusText.value = '已连接（模拟）';

    // 模拟消息生成
    const mockMessages = [
      {
        sender: 'assistant',
        content: '你好！我是智能助手，很高兴为你服务',
        contentType: 'text',
        // contentList: ['首件过程的检测频率如何？', '针对不可检测项，如何预防不良流出？', '项目检测过程中，如何避免设备故障？', '如何联系客服？'],
        timestamp: Date.now()
      },
      { sender: 'user', content: '如何使用这个系统？', contentType: 'text', timestamp: Date.now() },
      { sender: 'assistant', content: '你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流', contentType: 'text' },
      { sender: 'user', content: '如何使用这个系统？', contentType: 'text' },
      { sender: 'assistant', content: '你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流', contentType: 'text' },
      // { sender: 'user', content: '如何使用这个系统？', contentType: 'text' },
      // { sender: 'assistant', content: '你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流', contentType: 'text' },
    ];

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

      processMessage(message);
    }, 2000);
  };

  /**
   * 开始尝试重连
   */
  const startReconnect = () => {
    stopReconnect(); // 先停止之前的重连定时器
    reconnectTimer = setTimeout(initPolling, reconnectInterval);
  };

  /**
   * 停止尝试重连
   */
  const stopReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  /**
   * 停止轮询
   */
  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  };

  /**
   * 关闭轮询连接
   */
  const closePolling = () => {
    stopPolling();
    stopReconnect();
    connectionStatus.value = 'disconnected';
    connectionStatusText.value = '已断开连接';
  };

  /**
   * 组件挂载时执行
   */
  onMounted(() => {
    initPolling();
  });

  /**
   * 组件卸载前执行
   */
  onBeforeUnmount(() => {
    closePolling();
  });

  // 返回与useWebSocket相同的API
  return {
    connectionStatus,
    connectionStatusText,
    messages,
    sendMessage,
    addMessage,
    closePolling: closePolling,
    initPolling: initPolling
  };
};