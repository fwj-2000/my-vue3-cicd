<template>
  <div
    class="connection-status"
    :class="{
      connected: props.status === 'connected',
      disconnected: props.status === 'disconnected',
      connecting: props.status === 'connecting',
    }"
  >
    {{ props.statusText }}
  </div>
</template>

<script setup>
const props = defineProps({
  status: {
    type: String,
    default: "disconnected", // connected, disconnected, connecting
  },
  statusText: {
    type: String,
    default: "未连接",
  },
});
</script>

<style scoped lang="less">
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
</style>
