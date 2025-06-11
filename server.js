const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  // Log but don't exit
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Log but don't exit
})

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  })
  .listen(port, (err) => {
    if (err) throw err
    console.log(`
🚀 Meta Ads Dashboard - Production Server
========================================
✅ Ready on http://${hostname}:${port}
🛡️  Error handling: ENABLED
🔄 Auto-recovery: ENABLED
📊 Environment: ${dev ? 'development' : 'production'}
========================================
    `)
  })
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use.`)
      console.log('Try: lsof -ti:' + port + ' | xargs kill -9')
      process.exit(1)
    } else {
      console.error('Server error:', err)
    }
  })
})