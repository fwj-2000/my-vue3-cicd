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
  font-size: 12px;
  text-align: center;
  background-color: transparent;

  &.connected {
    background-color: transparent;
    color: #2e7d32;
  }

  &.disconnected {
    background-color: transparent;
    color: #c62828;
  }

  &.connecting {
    background-color: transparent;
    color: #ef6c00;
  }
}
</style>
