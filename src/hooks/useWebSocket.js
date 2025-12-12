import { ref, onMounted, onBeforeUnmount } from 'vue';

/**
* WebSocket hooks，用于管理WebSocket连接、消息接收、心跳保活和重连机制
* 
* 简单理解：
* WebSocket是一种让浏览器和服务器能实时双向通信的技术，就像两个人在打电话
* - 浏览器（客户端）可以随时给服务器发送消息
* - 服务器也可以随时给浏览器推送消息
* - 连接建立后，双方可以一直保持通信，直到一方主动关闭
* 
* @param {string} url - WebSocket服务器地址，类似于电话号码
* @param {Object} options - 配置选项，类似于通话设置
* @param {number} options.reconnectInterval - 重连间隔（毫秒），如果电话断了，多久后再拨打
* @param {number} options.heartbeatInterval - 心跳间隔（毫秒），每隔多久说一句"喂，还在吗？"保持通话
* @param {boolean} options.mock - 是否启用模拟模式，相当于用假电话模拟通话，不需要真实服务器
* @returns {Object} WebSocket状态和方法，相当于通话状态和控制按钮
*/
export const useWebSocket = (url, options = {}) => {
  // 默认配置：如果没有传入配置，就使用这些默认值
  const defaultOptions = {
    reconnectInterval: 5000, // 默认5秒后重连
    heartbeatInterval: 30000, // 默认30秒发送一次心跳
    mock: false // 默认不使用模拟模式，使用真实WebSocket连接
  };

  // 合并默认配置和用户传入的配置，用户配置会覆盖默认配置
  const { reconnectInterval, heartbeatInterval, mock } = { ...defaultOptions, ...options };

  // 状态管理：使用Vue的ref创建响应式变量，当值变化时，页面会自动更新
  const connectionStatus = ref('disconnected'); // 连接状态：disconnected(未连接)、connecting(连接中)、connected(已连接)
  const connectionStatusText = ref('未连接'); // 连接状态的中文描述，用于显示在页面上
  const messages = ref([]); // 存储对话消息的数组，每条消息包含发送者、内容和时间戳

  // WebSocket相关变量：保存WebSocket实例和定时器
  let ws = null; // WebSocket实例，相当于电话设备
  let heartbeatTimer = null; // 心跳定时器，相当于提醒"该发送心跳了"的闹钟
  let reconnectTimer = null; // 重连定时器，相当于提醒"该重连了"的闹钟

  /**
   * 初始化WebSocket连接
   * 
   * 功能：
   * - 创建WebSocket实例（或模拟实例）
   * - 设置各种事件监听（连接成功、接收消息、连接关闭、连接错误）
   * - 更新连接状态
   * 
   * 类比：
   * 就像拿起电话，拨打对方号码，并设置好电话的各种功能：
   * - 接通后该做什么
   * - 听到对方说话后该怎么做
   * - 通话结束后该怎么做
   * - 通话出错后该怎么做
   */
  const initWebSocket = () => {
    // 更新状态：正在连接中
    connectionStatus.value = 'connecting';
    connectionStatusText.value = '连接中...';

    try {
      if (mock) {
        // 使用模拟WebSocket：相当于用假电话模拟通话，不需要真实的服务器
        console.log('使用模拟WebSocket连接');
        ws = new MockWebSocket(url);
      } else {
        // 使用真实WebSocket：相当于拨打真实的电话号码
        console.log('使用真实WebSocket连接:', url);
        ws = new WebSocket(url);
      }

      /**
       * 连接成功事件
       * 当WebSocket连接成功建立时触发
       * 类比：电话接通了，对方说"喂"的那一刻
       */
      ws.onopen = () => {
        console.log('WebSocket连接成功'); // 在控制台打印连接成功信息，方便开发调试
        connectionStatus.value = 'connected'; // 更新状态为已连接
        connectionStatusText.value = '已连接'; // 更新状态文本
        startHeartbeat(); // 开始发送心跳，相当于通话开始后定期确认对方是否还在
      };

      /**
       * 接收消息事件
       * 当收到服务器发送的消息时触发
       * 类比：对方说话了，你听到了对方的声音
       */
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('收到消息:', message);

          switch (message.type) {
            case 'heartbeat':
              // 处理心跳消息，无需特殊处理，连接正常
              console.log('心跳响应，连接正常');
              break;
            case 'message':
              // 处理对话消息
              const sender = message.data?.sender || message.sender;
              const content = message.data?.content || message.content;
              const contentType = message.data?.contentType || message.contentType || 'text';
              addMessage(sender, content, contentType);
              break;
            case 'stream':
              // 处理数字人流状态消息
              if (message.data) {
                // 可以在这里添加流状态处理逻辑
                console.log('数字人流状态变化:', message.data.status);
                // 例如：更新数字人流状态，通知数字人组件
                // emit('stream-status-change', message.data);
              }
              break;
            default:
              console.warn('未知消息类型:', message.type);
          }
        } catch (error) {
          console.error('消息解析失败:', error);
        }
      };

      /**
       * 连接关闭事件
       * 当WebSocket连接关闭时触发
       * 类比：通话结束了，对方挂断了电话
       */
      ws.onclose = () => {
        console.log('WebSocket连接关闭'); // 在控制台打印连接关闭信息
        connectionStatus.value = 'disconnected'; // 更新状态为未连接
        connectionStatusText.value = '已断开连接，正在尝试重连...'; // 更新状态文本
        stopHeartbeat(); // 停止发送心跳，因为通话已经结束了
        startReconnect(); // 开始尝试重连，相当于通话断了，重新拨打
      };

      /**
       * 连接错误事件
       * 当WebSocket连接出现错误时触发
       * 类比：通话过程中出现了噪音或信号问题，听不清楚对方说话
       */
      ws.onerror = (error) => {
        console.error('WebSocket错误:', error); // 在控制台打印错误信息
        connectionStatus.value = 'disconnected'; // 更新状态为未连接
        connectionStatusText.value = '连接错误，正在尝试重连...'; // 更新状态文本
        stopHeartbeat(); // 停止发送心跳
      };
    } catch (error) {
      // 如果WebSocket初始化失败，在控制台打印错误信息
      console.error('WebSocket初始化失败:', error);
      connectionStatus.value = 'disconnected'; // 更新状态为未连接
      connectionStatusText.value = '初始化失败，正在尝试重连...'; // 更新状态文本
      startReconnect(); // 开始尝试重连
    }
  };

  /**
   * 添加消息到对话列表
   * 
   * 功能：
   * - 将收到的消息格式化后添加到消息数组中
   * - 每条消息包含发送者、内容和当前时间
   * 
   * 类比：
   * 就像把对方说的话记录到聊天记录里，每条记录包含：
   * - 谁发的消息（user表示用户，assistant表示助手）
   * - 说了什么内容
   * - 什么时候说的
   * 
   * @param {string} sender - 发送者：'user'(用户/提问方) 或 'assistant'(助手/回答方)
   * @param {string} content - 消息内容，也就是说话的内容
   */
  const addMessage = (sender, content, contentType = 'text', timestamp) => {
    // 创建消息对象：包含发送者、内容、类型和当前时间
    const message = {
      sender, // 谁发的消息
      content, // 消息内容
      contentType, // 内容类型
      timestamp // 消息发送的时间戳
    };
    // 将消息添加到消息数组中，Vue会自动更新页面，显示新消息
    messages.value.push(message);
  };

  /**
   * 发送消息
   * 
   * 功能：
   * - 向服务器发送消息
   * - 检查WebSocket是否处于打开状态，只有打开状态才能发送消息
   * 
   * 类比：
   * 就像对着电话说话，只有当电话接通时，对方才能听到你说的话
   * 
   * @param {Object} message - 要发送的消息对象
   */
  const sendMessage = (message) => {
    // 检查WebSocket是否处于打开状态
    if (ws && ws.readyState === WebSocket.OPEN) {
      // 将消息对象转换为JSON字符串，然后发送给服务器
      // 相当于把要说的话转换成服务器能理解的格式
      ws.send(JSON.stringify(message));
    } else {
      // 如果WebSocket未连接，在控制台打印错误信息
      console.error('WebSocket未连接，无法发送消息');
    }
  };

  /**
   * 发送心跳消息
   * 
   * 功能：
   * - 定期向服务器发送一个特殊的心跳消息
   * - 用于确认连接还活着
   * 
   * 类比：
   * 就像在通话中每隔一段时间问一句："喂，你还在听吗？"
   * 如果对方回应了，说明连接还正常
   * 如果没回应，说明连接可能断了
   */
  const sendHeartbeat = () => {
    // 检查WebSocket是否处于打开状态
    if (ws && ws.readyState === WebSocket.OPEN) {
      // 发送一个类型为heartbeat的消息
      ws.send(JSON.stringify({ type: 'heartbeat' }));
    }
  };

  /**
   * 开始发送心跳
   * 
   * 功能：
   * - 设置一个定时器，定期调用sendHeartbeat函数
   * - 先停止之前的心跳定时器，避免多个定时器同时运行
   * 
   * 类比：
   * 就像设置一个闹钟，每隔一段时间提醒你说一句："喂，你还在听吗？"
   */
  const startHeartbeat = () => {
    stopHeartbeat(); // 先停止之前的心跳定时器
    // 设置新的定时器：每隔heartbeatInterval毫秒调用一次sendHeartbeat
    heartbeatTimer = setInterval(sendHeartbeat, heartbeatInterval);
  };

  /**
   * 停止发送心跳
   * 
   * 功能：
   * - 清除心跳定时器
   * - 释放资源，避免内存泄漏
   * 
   * 类比：
   * 就像关闭提醒你发送心跳的闹钟
   */
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer); // 清除定时器
      heartbeatTimer = null; // 将定时器变量设为null，避免内存泄漏
    }
  };

  /**
   * 开始尝试重连
   * 
   * 功能：
   * - 设置一个定时器，一段时间后重新初始化WebSocket连接
   * - 先停止之前的重连定时器，避免多个定时器同时运行
   * 
   * 类比：
   * 就像设置一个闹钟，过一会儿提醒你重新拨打对方的电话
   */
  const startReconnect = () => {
    stopReconnect(); // 先停止之前的重连定时器
    // 设置新的重连定时器：reconnectInterval毫秒后调用initWebSocket重新连接
    reconnectTimer = setTimeout(initWebSocket, reconnectInterval);
  };

  /**
   * 停止尝试重连
   * 
   * 功能：
   * - 清除重连定时器
   * - 释放资源，避免内存泄漏
   * 
   * 类比：
   * 就像关闭提醒你重连的闹钟
   */
  const stopReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer); // 清除定时器
      reconnectTimer = null; // 将定时器变量设为null，避免内存泄漏
    }
  };

  /**
   * 关闭WebSocket连接
   * 
   * 功能：
   * - 关闭WebSocket连接
   * - 清除所有定时器
   * - 释放资源，避免内存泄漏
   * 
   * 类比：
   * 就像挂断电话，关闭所有相关设备
   */
  const closeWebSocket = () => {
    if (ws) {
      ws.close(); // 关闭WebSocket连接
      ws = null; // 将WebSocket实例设为null，避免内存泄漏
    }
    stopHeartbeat(); // 停止发送心跳
    stopReconnect(); // 停止尝试重连
  };

  /**
   * 组件挂载时执行
   * 
   * 功能：
   * - 当使用这个hooks的组件被挂载到页面上时，初始化WebSocket连接
   * 
   * 类比：
   * 就像当你打开聊天页面时，自动拨打WebSocket服务器的电话
   */
  onMounted(() => {
    initWebSocket(); // 调用初始化WebSocket函数
  });

  /**
   * 组件卸载前执行
   * 
   * 功能：
   * - 当使用这个hooks的组件从页面上卸载时，关闭WebSocket连接
   * 
   * 类比：
   * 就像当你关闭聊天页面时，自动挂断电话
   */
  onBeforeUnmount(() => {
    closeWebSocket(); // 调用关闭WebSocket函数
  });

  // 返回WebSocket状态和方法，供组件使用
  // 相当于给组件提供了控制WebSocket的按钮和显示状态的仪表盘
  return {
    connectionStatus, // 连接状态：disconnected/connecting/connected
    connectionStatusText, // 连接状态的中文描述
    messages, // 对话消息列表
    sendMessage, // 发送消息的方法 这个项目用不到
    addMessage, // 添加消息到列表的方法
    closeWebSocket, // 关闭连接的方法
    initWebSocket // 初始化连接的方法
  };
};

/**
 * MockWebSocket类
 * 
 * 功能：
 * - 模拟WebSocket的行为
 * - 不需要真实的服务器
 * - 用于开发和测试，当没有后端服务器时使用
 * 
 * 类比：
 * 就像一个假电话，能模拟通话的各种状态和行为，但实际上没有真实的通话
 */
class MockWebSocket {
  /**
   * 创建MockWebSocket实例
   * @param {string} url - WebSocket服务器地址（模拟用，实际不使用）
   */
  constructor(url) {
    this.url = url; // WebSocket服务器地址（模拟用）
    this.readyState = WebSocket.CONNECTING; // 当前连接状态：CONNECTING(连接中)

    // WebSocket事件回调，这些回调函数会在相应事件发生时被调用
    this.onopen = null; // 连接成功时的回调
    this.onmessage = null; // 接收消息时的回调
    this.onclose = null; // 连接关闭时的回调
    this.onerror = null; // 连接错误时的回调

    // 模拟连接成功：1秒后将状态改为OPEN(已连接)，并调用onopen回调
    setTimeout(() => {
      this.readyState = WebSocket.OPEN; // 更新状态为已连接
      if (this.onopen) this.onopen(); // 如果设置了onopen回调，就调用它
      this.startMockMessages(); // 开始生成模拟消息
    }, 1000);
  }

  /**
   * 模拟消息生成
   * 
   * 功能：
   * - 定期生成模拟消息
   * - 模拟用户和助手之间的对话
   * - 调用onmessage回调，将模拟消息传递给使用MockWebSocket的组件
   */
  startMockMessages () {
    // 模拟发送方消息，按照顺序生成对话
    const mockMessages = [
      { sender: 'assistant', content: '你好！我是智能助手，很高兴为你服务', contentType: 'text' },
      { sender: 'user', content: '能给我看一张项目的截图吗？', contentType: 'text' },
      { sender: 'assistant', content: 'https://img3.redocn.com/20110418/20110416_6ad206b20544a083fdb0B6Kj0dud4sro.jpg', contentType: 'image' },
      { sender: 'user', content: '有介绍视频吗？', contentType: 'text' },
      { sender: 'assistant', content: 'https://vod.v.jstv.com/2025/09/01/JSTV_JSGGNEW_1756730917831_1c7SAd4_1823.mp4', contentType: 'video' },
      { sender: 'user', content: '如何使用这个系统？', contentType: 'text' },
      { sender: 'assistant', content: '你可以直接发送消息，系统会自动回复，同时左侧会显示数字人流', contentType: 'text' }
    ];

    // 定时发送模拟消息：每隔2秒发送一条消息
    let index = 0; // 当前发送的消息索引
    const interval = setInterval(() => {
      // 如果所有消息都发送完了，就清除定时器，停止发送
      if (index >= mockMessages.length) {
        clearInterval(interval);
        return;
      }

      // 获取当前要发送的消息
      const mockMsg = mockMessages[index++];
      // 创建完整的消息对象，包含类型、发送者、内容和时间戳
      const message = {
        type: 'message', // 消息类型：message表示普通消息
        ...mockMsg, // 包含sender和content
        timestamp: Date.now() // 消息发送的时间戳
      };

      // 如果设置了onmessage回调，就调用它，将模拟消息传递给组件
      if (this.onmessage) {
        this.onmessage({ data: JSON.stringify(message) });
      }
    }, 2000); // 每隔2秒发送一条消息
  }

  /**
   * 模拟发送消息
   * 
   * 功能：
   * - 模拟发送消息的行为
   * - 实际上不会真正发送消息，只会在控制台打印
   * 
   * @param {string} data - 要发送的数据（JSON字符串）
   */
  send (data) {
    // 检查连接状态，如果是OPEN(已连接)状态，就打印发送的消息
    if (this.readyState === WebSocket.OPEN) {
      console.log('发送消息:', data);
      // 这里可以添加模拟回复逻辑，比如根据发送的消息生成相应的回复
    }
  }

  /**
   * 模拟关闭连接
   * 
   * 功能：
   * - 模拟关闭WebSocket连接
   * - 更新连接状态为CLOSED(已关闭)
   * - 调用onclose回调
   */
  close () {
    this.readyState = WebSocket.CLOSED; // 更新状态为已关闭
    if (this.onclose) this.onclose(); // 如果设置了onclose回调，就调用它
  }
}