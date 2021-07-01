const express = require('express');
const WebSocket = require('ws');
const SocketServer = WebSocket.Server;
const server = express().listen(8082);
const wss = new SocketServer({server});
const randomToken = require('random-token');

const maxElementosSala = 5
let user = {}
let users = []
const salas = [{nome: "millennium", qtdade: 0},{nome: "destroyer", qtdade: 0},{nome: "x-wing", qtdade: 0}]


wss.on('connection', (ws) => {
    console.log('[Servidor] Um cliente se conectou!')
    
    ws.on('close', () => {

        console.log('[Servidor] Um cliente se desconectou!' + ws)
    })

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
                        adiciona_usuario_sala(user.sala)
                    } else {
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
verifica_sala = (nomeSala) => {
    // nome da sala errada - (onde vai estar esses nomes???)
    const salaFilter = salas.filter( (sala) => {
        return sala.nome === nomeSala
    })
    if(salaFilter.length > 0){
        const salaPop = salaFilter.pop()
        if(salaPop.qtdade >= maxElementosSala){
            return false
        }
    }
    return true
}


adiciona_usuario_sala = (nomeSala) => {
    salas.forEach((sala) => {
        if(sala.nome === nomeSala){
            sala.qtdade ++
        }
    })
}
