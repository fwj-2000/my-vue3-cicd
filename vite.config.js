import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // 【关键修改点】添加这一行，对应你的仓库名
    // 注意：前后都有斜杠
    base: '/my-vue3-cicd/', 

    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    // 只有开发环境需要代理配置
    server: {
      proxy: {
        // 配置跨域代理
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://192.168.1.103:9090',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})