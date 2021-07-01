const express = require('express');
const WebSocket = require('ws');
const SocketServer = WebSocket.Server;
const server = express().listen(8082);
const wss = new SocketServer({server});
const randomToken = require('random-token');

const maxElementosSala = 5
let user = {}
let users = []
const salas = []


wss.on('connection', (ws) => {
    console.log('[Servidor] Um cliente se conectou!')
    
    ws.on('close', () => { console.log('[Servidor] Um cliente se desconectou!') })

    ws.on('message', (msg) => { 
        var req = msg.split(":")
        console.log(req)
        switch(req[0]){
            case 'entrar':
                if(verifica_sala(req[2])){
                    let verificaNome = verifica_nome(req[1])
                    if(verificaNome===200){
                        //verificacao ok
                        user.id = req[1]
                        user.token = randomToken(16)
                        user.ws = ws
                        user.sala = req[2]
                        user.ws.send("ok:"+user.token+":200")
                        users.push(user)
                        adiciona_usuario_sala(user)
                    } else{
                        //problemas na verificacao usuario incorreto
                        ws.send("nok:"+verificaNome)
                        ws.close()
                    }
                } else {
                    ws.send("nok:402")
                    ws.close()
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

// Verifica se o nome do cliente é válido
verifica_nome = (nome) => {
    if(nome.includes(" ") || (nome.includes(":"))){
        return 401
    }
    userFilter = users.filter((user) => {
        return user.id === nome
    })
    if(userFilter.length > 0){
        return 400
    }
    return 200
}

// Verifica se a sala existe
verifica_sala = (salaObj) => {
    // nome da sala errada - (onde vai estar esses nomes???)
    // sala cheia - (onde vai estar essa informação???)
    const salaFilter = salas.filter( (sala) => {
        return sala.nome === salaObj
    })
    if(salaFilter.length > 0){
        const salaPop = salaFilter.pop()
        if(salaPop.qtdade >= maxElementosSala){
            return false
        }
    }
    return true
}


adiciona_usuario_sala = (usuario) => {
    let salaFilter = salas.filter( (sala) => {
        return sala.nome === usuario.sala
    })
    if(salaFilter.length > 0){
        salas.forEach( sala => {
            if(sala.nome === usuario.sala){
                sala.qtdade ++
            }
        })
    } else {
        obj = {
            nome: usuario.sala,
            qtdade: 1
        }
        salas.push(obj)
    }
}
