const express = require('express');
const WebSocket = require('ws');
const SocketServer = WebSocket.Server;
const server = express().listen(8082);
const wss = new SocketServer({server});

const users_id = []
const users_ws = []
const cod = '200'


wss.on('connection', (ws) => {
    console.log('[Servidor] Um cliente se conectou!')
    
    ws.on('close', () => { console.log('[Servidor] Um cliente se desconectou!') })

    ws.on('message', (msg) => { 
        
        var req = msg.split(":")
        console.log(req)

        switch(req[0]){
            case 'entrar':
                if (entrada(req[1],req[2])) {
                    id = random_id()
                    users_ws.push(ws)
                    users_id.push(id)
                    ws.send("ok:"+id+":"+cod)
                } else {
                    ws.send("nok:"+cod)
                } 
                break;
            case 'alive':
                break
            case 'fim':
                break
            default:
                console.log("erro")
        }
    
    })

})

// Tratamentos de entrada do cliente
entrada = (nome,sala) => {
    if (verifica_nome(nome)){
        if (verifica_sala(sala)) {
            cod = '200'
            return true
        } else {
            cod = '402'
            return false
        }
    } else {
        // cod = '400' NOME DUPLICADO
        cod = '400' // NOME ERRADO
        return false    
    }
}

// Verifica se o nome do cliente é válido
verifica_nome = (nome) => {
    return true
}

// Verifica se a sala existe
verifica_sala = (sala) => {
    // nome da sala errada - (onde vai estar esses nomes???)
    // sala cheia - (onde vai estar essa informação???)
    return true
}

// Cria ID aleatório para o usuário
random_id = () => {
    var a = ['a','b','c','d','e','f','g','h','i','j']
    var A = ['A','B','C','D','E','F','G','H','I','J']
    ts = new Date().getTime().toString()
    return a[ts[12]] + a[ts[11]] + A[ts[10]] + A[ts[9]]
}


