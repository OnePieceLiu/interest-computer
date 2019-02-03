const http = require('http')

const server = http.createServer((req, res)=>{
    res.write('hello world!')
    res.end()
})

server.listen(8765, ()=>{
    console.log('app is running at port 8765!')
})