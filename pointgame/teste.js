const salas = [{nome: "millennium", qtdade: 0},{nome: "destroyer", qtdade: 0},{nome: "x-wing", qtdade: 0}]
const salaNome = "x-wing"
userFilter = salas.filter( (sala) => {
    return sala.nome === salaNome
})

// console.log(userFilter)
// console.log(salas.indexOf(salas.nome == "millennium"))
console.log(salas)
var index = salas.findIndex( sala => sala.nome === salaNome)
console.log(index)
salas.splice(index,1)
console.log(salas)