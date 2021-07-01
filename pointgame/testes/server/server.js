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
    console.log('[Servidor] Um cliente se conectou! ')
   
    ws.on('message', (msg) => { 
        var req = ""
        req = msg.split(":")
        console.log("> ", req)
        
        switch(req[0]){
            case 'entrar':
                if(verifica_sala(req[2])){
                    let verificaNome = verifica_nome(req[1])
                    user.id = user.token = user.ws = user.sala = ""
                    if(verificaNome===200){
                        //verificacao ok
                        console.log("entrou", req[1])
                        user.id = req[1]
                        user.token = randomToken(16)
                        user.ws = ws
                        user.sala = req[2]
                        users.push(user)
                        adiciona_usuario_sala(user.sala)
                        ws.send("ok:"+user.token+":200")
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
                exclui_usuario(req[1])
                ws.send("ok:202")
                ws.close()
                break
            default:
                console.log("erro")
        }
    
        // Lista de usuários 
        for (let i = 0; i < users.length; i++) {
            console.log(users[i].id)
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

// Verifica se a sala está disponível 
// OBS: Como a sala é fixa, não precisamos verificar se ela existe
verifica_sala = (nomeSala) => {
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

// Alterada quantidade usuários da sala
adiciona_usuario_sala = (nomeSala) => {
    salas.forEach((sala) => {
        if(sala.nome === nomeSala){
            ++sala.qtdade 
        }
    })
}

// Exclui o usuário em caso de desconexão
exclui_usuario = (token) => {
    
    // Procurando usuário
    userFilter = users.filter((user) => {
        return user.token === token
    })

    // Alterando jogadores na sala
    salas.forEach((sala) => {
        if(sala.nome === userFilter.sala){
            --sala.qtdade 
        }
    })

    // Removendo usuário
    var index = users.findIndex( user => user.token === token)
    users.splice(index,1) 

    return true
}