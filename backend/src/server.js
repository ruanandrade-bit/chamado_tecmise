import app from './app.js'
import { initStore } from './services/memoryStore.js'

const PORT = Number.parseInt(process.env.PORT || '4000', 10)

async function start() {
  await initStore()

  app.listen(PORT, () => {
    console.log(`S4S backend rodando em http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err)
  process.exit(1)
})
