# ChatMessages组件拆分实现计划

## 1. 实现步骤

### 步骤1：创建目录结构
- 创建 `src/views/chatMessages/components/` 目录
- 创建 `src/views/chatMessages/components/content/` 目录
- 创建 `src/views/chatMessages/components/tag/` 目录

### 步骤2：实现子组件
1. 实现 `ConnectionStatus.vue` - 连接状态提示组件
2. 实现 `Tag.vue` - 单个标签组件
3. 实现 `TagList.vue` - 标签列表组件
4. 实现 `TextMessage.vue` - 文本消息组件
5. 实现 `ImageMessage.vue` - 图片消息组件
6. 实现 `VideoMessage.vue` - 视频消息组件
7. 实现 `MessageItem.vue` - 消息项组件
8. 更新 `index.vue` - 主聊天消息组件，引入并使用上述子组件

### 步骤3：测试验证
- 确保组件拆分后功能正常
- 检查样式是否一致
- 验证交互逻辑是否正常

## 2. 组件实现细节

### 2.1 ConnectionStatus.vue
- 接收 `status` 和 `statusText` props
- 根据 status 动态应用不同样式（connected/disconnected/connecting）

### 2.2 Tag.vue
- 接收 `tag` prop 显示标签内容
- 实现悬停和点击效果

### 2.3 TagList.vue
- 接收 `tags` prop（标签数组）
- 渲染多个 Tag 组件

### 2.4 消息内容组件
- 每个组件接收 `content` prop
- 根据消息类型渲染不同内容

### 2.5 MessageItem.vue
- 接收 `message` prop
- 根据 message.contentType 渲染不同的消息内容组件
- 包含消息时间格式化逻辑
- 包含 TagList 组件

### 2.6 index.vue
- 引入并使用所有子组件
- 管理消息列表和滚动逻辑

## 3. 技术要点
- 使用 Vue 3 的 Composition API
- 保持组件间的数据传递清晰
- 确保样式的一致性
- 遵循单一职责原则

现在我将开始实现这个计划，逐步创建和更新组件文件。