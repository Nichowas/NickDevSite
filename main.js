const port = 'https://nickdevserver.herokuapp.com/';
// const port = 'http://localhost:8080';
var socket = io.connect(port);
var game = new Game(
    new Pawn(0, 6), new Pawn(1, 6), new Pawn(2, 6), new Pawn(3, 6),
    new Pawn(4, 6), new Pawn(5, 6), new Pawn(6, 6), new Pawn(7, 6),
    new Rook(0, 7), new Rook(7, 7),
    new Bishop(2, 7), new Bishop(5, 7),
    new Knight(1, 7), new Knight(6, 7),
    new King(4, 7), new Queen(3, 7),

    new Pawn(0, 1), new Pawn(1, 1), new Pawn(2, 1), new Pawn(3, 1),
    new Pawn(4, 1), new Pawn(5, 1), new Pawn(6, 1), new Pawn(7, 1),
    new Rook(0, 0), new Rook(7, 0),
    new Bishop(2, 0), new Bishop(5, 0),
    new Knight(1, 0), new Knight(6, 0),
    new King(4, 0), new Queen(3, 0),
);
game.clientTurn = null;

socket.on('update', (data) => {
    let { piece: id, x, y } = data
    let p = game.pieces[id]

    p.makeMove(x, y, true)
    p.render()

    game.serverTurn = game.clientTurn
})
socket.on('ready', (i) => {
    board.className = 'connect'
    game.setTurn(i)
    game.moveMade = function (p, x, y) {
        game.serverTurn = game.clientTurn.not
        socket.emit('update', { piece: p.rid, x, y })
    }
    // socket.emit('update', p1)
})
socket.on('leave', () => {
    game.removeHighlights()
    board.className = 'disconnect'
    game.clientTurn = null;
})

var roomsText = document.getElementById('rooms-text')
function roomsToText(rooms) {
    let text = 'GAMES:\n'
    for (let i = 0; i < rooms.length; i++) {
        text += `Game #${i}:\n`
        for (let j = 0; j < rooms[i].length; j++) {
            text += ` > ${rooms[i][j].name}\n`
        }
    }
    return text
}

var Rooms = []
socket.on('rooms', rooms => {
    Rooms = rooms
    let text = roomsToText(rooms).replace(/\n/g, '</br>')
    roomsText.innerHTML = text
})

var gform = document.getElementById('game-form')
var gformText = document.getElementById('game-form-text')
var gformSubmit = document.getElementById('game-form-submit')


gform.addEventListener('submit', (e) => {
    e.preventDefault()
    if (gformText.value === '') return
    socket.emit('join', gformText.value)
    ableForms()
})

var cform = document.getElementById('challenge-form')
var cformText = document.getElementById('challenge-form-text')
var cformOpponent = document.getElementById('challenge-form-opponent')
var cformSubmit = document.getElementById('challenge-form-submit')


cform.addEventListener('submit', (e) => {
    e.preventDefault()
    if (cformText.value === '' || cformOpponent.value === '') return
    if (!Rooms.find(g => g[0].name === cformOpponent.value && g.length == 1)) return
    socket.emit('join', cformText.value, cformOpponent.value)
    ableForms()
})

function ableForms(t = true) {
    gformText.disabled = t
    gformSubmit.disabled = t
    cformText.disabled = t
    cformOpponent.disabled = t
    cformSubmit.disabled = t
}


socket.on('join', () => {
    board.className = 'connect'
})