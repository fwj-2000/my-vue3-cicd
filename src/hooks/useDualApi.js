import { ref, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';

/**
* 使用axios进行双接口通信的hooks，一个接口用于发送消息，一个接口用于接收机器人回答
*
* @param {string} sendUrl - 发送消息的接口地址
* @param {string} receiveUrl - 接收机器人回答的接口地址
* @param {Object} options - 配置选项
* @param {number} options.pollingInterval - 轮询间隔（毫秒）
* @param {number} options.reconnectInterval - 重连间隔（毫秒）
* @param {number} options.timeout - 请求超时时间（毫秒）
* @param {boolean} options.mock - 是否启用模拟模式
* @returns {Object} 通信状态和方法
*/
export const useDualApi = (sendUrl, receiveUrl, options = {}) => {
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
  let isWaitingForResponse = false; // 标记是否正在等待回答接口的响应
  let lastMessageTimestamp = null; // 上一条消息的时间戳，用于判断是否需要请求新接口

  /**
   * 初始化通信
   */
  const initCommunication = () => {
    // 更新状态：正在连接中
    connectionStatus.value = 'connecting';
    connectionStatusText.value = '连接中...';

    try {
      if (mock) {
        // 使用模拟模式
        console.log('使用模拟双接口通信模式');
        startMockCommunication();
      } else {
        // 使用真实接口通信
        console.log('使用真实双接口通信:', { sendUrl, receiveUrl });
        startPolling();
      }
    } catch (error) {
      console.error('通信初始化失败:', error);
      connectionStatus.value = 'disconnected';
      connectionStatusText.value = '初始化失败，正在尝试重连...';
      startReconnect();
    }
  };

  /**
   * 开始轮询接收接口
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
    if (isPolling || isWaitingForResponse) {
      console.log('上一个轮询请求尚未完成或正在等待响应，跳过本次请求');
      return;
    }
    isPolling = true;

    try {
      // 发送GET请求获取消息，添加超时处理
      const response = await axios.get(receiveUrl, {
        params: {
          lastMessageId: lastMessageId
        },
        timeout: timeout // 添加超时设置
      });
      const { status, data: message } = response
      console.log("🚀 ~ poll ~ status, data:", status, message)

      // 比较当前数据与上一次数据是否一致，一致则跳过处理
      const isDataSame = JSON.stringify(message) === JSON.stringify(lastResponseData);
      if (isDataSame) {
        console.log('轮询数据未变化，跳过处理');
        return;
      }

      if (status === 200) {
        // 标记正在等待响应处理完成
        isWaitingForResponse = true;

        processMessage({ type: "message", ...message });
        // 更新缓存数据
        lastResponseData = message;

        // 更新最后消息时间戳
        lastMessageTimestamp = Date.now();

        // 延迟一段时间后再允许下一次轮询（确保文字显示完成）
        setTimeout(() => {
          isWaitingForResponse = false;
        }, 1000); // 延迟 1 秒，确保文字显示完成
      }

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

          // 如果是助手消息，移除思考状态
          if (sender === 'assistant') {
            removeThinkingState();
          }

          addMessage(sender, content, contentType, timestamp, contentList);
          lastMessageId = message.id || Date.now();
        } else {
          const { assistant_text } = message
          if (assistant_text) {
            // 移除思考状态
            removeThinkingState();
            addMessage('assistant', assistant_text);
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
  const addMessage = (sender, content, contentType = 'text', timestamp, contentList, isThinking = false) => {
    // 创建消息对象
    const message = {
      sender,
      content,
      contentType,
      timestamp: timestamp || Date.now(),
      contentList,
      isThinking // 是否处于思考状态
    };

    // 添加消息到列表
    messages.value.push(message);
  };

  /**
   * 发送消息
   */
  const sendMessage = async (message) => {
    try {
      // 发送用户消息
      addMessage('user', message.content);

      // 添加数字人思考中状态
      addMessage('assistant', '', 'text', Date.now(), null, true);

      // 使用POST请求发送消息，添加超时处理
      const response = await axios.post(sendUrl, message, {
        timeout: timeout
      });

      // 检查响应数据是否为 null 或错误
      if (!response.data || response.data.error) {
        console.error('消息发送接口返回错误或 null:', response.data);
        // 移除思考状态
        removeThinkingState();
        // 添加错误提示消息
        addMessage('assistant', '抱歉，系统暂时无法处理您的请求，请稍后重试。', 'text', Date.now());
        return;
      }

      console.log('消息发送成功:', message);

      // 注意：思考状态会在收到回复时通过 processMessage 函数移除
    } catch (error) {
      console.error('消息发送失败:', error);
      // 移除思考状态
      removeThinkingState();
      // 添加错误提示消息
      addMessage('assistant', '抱歉，系统暂时无法处理您的请求，请稍后重试。', 'text', Date.now());
      throw error;
    }
  };

  /**
   * 开始模拟通信
   */
  const startMockCommunication = () => {
    // 更新状态为已连接
    connectionStatus.value = 'connected';
    connectionStatusText.value = '已连接（模拟）';

    // 模拟用户发送消息后，数字人开始思考
    // 先添加一个用户消息
    addMessage('user', '你好，我想了解一下这个系统的使用方法', 'text', Date.now());

    // 添加思考状态
    addMessage('assistant', '', 'text', Date.now(), null, true);

    // 延迟一段时间后发送助手回答
    setTimeout(() => {
      // 移除思考状态
      removeThinkingState();

      // 添加助手回答
      addMessage('assistant', '你好！我是智能助手，很高兴为你服务。你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流。', 'text', Date.now());

      // 继续发送其他模拟消息
      const mockMessages = [
        { sender: 'user', content: '如何使用这个系统？', contentType: 'text', timestamp: Date.now() },
        { sender: 'assistant', content: '你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流', contentType: 'text' },
        { sender: 'user', content: '如何使用这个系统？', contentType: 'text' },
        { sender: 'assistant', content: '你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流', contentType: 'text' },
      ];

      let index = 0;
      const interval = setInterval(() => {
        if (index >= mockMessages.length) {
          clearInterval(interval);
          return;
        }

        const mockMsg = mockMessages[index++];

        // 如果是用户消息，添加思考状态
        if (mockMsg.sender === 'user') {
          addMessage(mockMsg.sender, mockMsg.content, mockMsg.contentType, mockMsg.timestamp);
          addMessage('assistant', '', 'text', Date.now(), null, true);

          // 延迟显示助手回答
          setTimeout(() => {
            removeThinkingState();
            const nextMsg = mockMessages[index++];
            if (nextMsg && nextMsg.sender === 'assistant') {
              addMessage(nextMsg.sender, nextMsg.content, nextMsg.contentType, Date.now());
            }
          }, 2000);
        }
      }, 4000);
    }, 3000); // 延迟 3 秒，模拟思考时间
  };

  /**
   * 移除思考状态消息
   */
  const removeThinkingState = () => {
    // 找到并移除正在思考的消息
    const thinkingIndex = messages.value.findIndex(msg => msg.sender === 'assistant' && msg.isThinking);
    if (thinkingIndex > -1) {
      messages.value.splice(thinkingIndex, 1);
    }
  };

  /**
   * 开始尝试重连
   */
  const startReconnect = () => {
    stopReconnect(); // 先停止之前的重连定时器
    reconnectTimer = setTimeout(initCommunication, reconnectInterval);
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
   * 关闭通信连接
   */
  const closeCommunication = () => {
    stopPolling();
    stopReconnect();
    connectionStatus.value = 'disconnected';
    connectionStatusText.value = '已断开连接';
  };

  /**
   * 组件挂载时执行
   */
  onMounted(() => {
    initCommunication();
  });

  /**
   * 组件卸载前执行
   */
  onBeforeUnmount(() => {
    closeCommunication();
  });

  // 返回API
  return {
    connectionStatus,
    connectionStatusText,
    messages,
    sendMessage,
    addMessage,
    closeCommunication,
    initCommunication
  };
};
