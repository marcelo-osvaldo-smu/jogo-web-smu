const express = require('express');
const WebSocket = require('ws');
const SocketServer = WebSocket.Server;
const server = express().listen(8082);
const wss = new SocketServer({server});

wss.on('connection', (ws) => {
    console.log('[Servidor] Um cliente se conectou!')
    
    ws.on('close', () => { console.log('[Servidor] Um cliente se desconectou!') })

    ws.on('message', (msg) => { console.log(msg, ws.url) })
})


