var socket = io('http://localhost:3000');
var idSocket = ""

var nome = ""
var sala = ""

// Início da conexão e enviando pedido autenticação
socket.on('connect', function(){ 
    nome = window.prompt('Qual o seu nome?');
    sala = window.prompt('Qual a sala?');
    var usuario = {
        nome: nome,
        sala: sala,
    }
    var a = "entrar:"+usuario.nome+":"+usuario.sala
    console.log("> Enviando pedido de registro: "+a)
    socket.emit('autenticacaoServidor', a)
})

// Recebendo resposta de autenticação
socket.on('autenticacaoCliente', data => {
    var req = data.split(":")
    
    console.log("> Resposta recebida: ")
    if (req[0]==="ok") {
        idSocket = req[1]
        console.log("id: "+idSocket)
    } else {
        console.log("Erro "+req[1])
        socket.disconnect()
    }
    
})

// Recebendo lista de jogadores ativos
socket.on('atualizarUsers', data => {
    var i = 0
    $('#users').empty().trigger("change");
    data.forEach((jogador) => {
        if (jogador.nome!=nome) {
            $('#users').append(new Option(jogador.nome, i));
            i++;
        }    
    })
})

// Recebendo resposta de desconexão
socket.on('disconnectCliente', data => {
    console.log(data)
    socket.disconnect()
})