import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,  // 使用するポート番号を指定
    host: '0.0.0.0',  // すべてのIPアドレスからアクセスを受け入れる
    watch: {
      usePolling: true,  // ファイル変更の検出をポーリング方式にする（特にDocker環境で必要）
    },
  },
})
