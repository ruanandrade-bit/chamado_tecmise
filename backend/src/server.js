import app from './app.js'

const PORT = Number.parseInt(process.env.PORT || '4000', 10)

app.listen(PORT, () => {
  console.log(`S4S backend rodando em http://localhost:${PORT}`)
})
