const port = 'https://nickdevserver.herokuapp.com/';
// const port = 'http://localhost:3000';
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
socket.on('soft-leave', () => {
    game.removeHighlights()
    game.clientTurn = null;
})
socket.on('hard-leave', () => {
    game.removeHighlights()
    board.className = 'disconnect'
    connected = undefined;
    game.clientTurn = null;
})



var connected;
socket.on('join', (r) => {
    board.className = 'connect'
    connected = r
})

var signIn = document.getElementsByClassName('g-signin2')[0]
var signInImg = document.getElementById('signin-img')
var signInName = document.getElementById('signin-p')
var signInButton = document.getElementById('signin-button')

var nickname;

const clientID = "894823189716 - ccnva78uf040snt722ah99culli84b12.apps.googleusercontent.com"
function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    // signIn.style.display = 'none'
    signInImg.src = profile.getImageUrl()
    signInImg.style.display = 'inline-block'

    nickname = profile.getName()
    signInName.innerHTML = nickname
    signInName.style.display = 'inline-block'

    signIn.style.display = 'none'
    signInButton.style.display = 'inline-block'
    signInButton.onclick = async () => {
        await gapi.auth2.getAuthInstance().signOut()
        nickname = ''
        signInImg.style.display = 'none'

        signInName.style.display = 'none'
        signInName.innerHTML = ''

        signIn.style.display = 'inline-block'
        signInButton.style.display = 'none'
    }
}
function clientDiv(c) {
    let div = document.createElement('div')
    div.className = 'room-client'
    div.innerHTML = c.name

    return div
}
function roomDiv(r, i, ...clients) {
    let div = document.createElement('div')
    div.className = 'room'
    div.innerHTML = r

    for (let c of clients) {
        div.appendChild(clientDiv(c))
    }

    let button = document.createElement('div')
    button.id = 'join-game'
    button.className = ''
    if (connected === undefined || connected != i)
        button.className = 'join'
    button.innerHTML = '<div></div><div></div>'

    button.addEventListener('click', () => {
        if (connected === undefined || connected != i) {
            socket.emit('join', nickname, i)
        } else {
            socket.emit('leave')
        }
    })
    div.appendChild(button)
    return div
}

var roomsWrapper = document.getElementById('rooms-wrapper')

var Rooms = []
socket.on('rooms', rooms => {
    Rooms = rooms
    while (roomsWrapper.firstChild) {
        roomsWrapper.removeChild(roomsWrapper.firstChild);
    }

    for (let i in rooms)
        roomsWrapper.appendChild(roomDiv(`Game #${i}`, i, ...rooms[i]))

    let button = document.createElement('div')
    button.id = 'new-game'
    button.innerHTML = '<div></div><div></div>'
    button.onclick = () => { socket.emit('join', nickname) }
    roomsWrapper.appendChild(button)
})