const port = 'https://nickdevserver.herokuapp.com/';
// const port = 'http://localhost:3000';
var socket = io.connect(port);
var game = new Game(
    new Pawn(0, 6), new Pawn(1, 6), new Pawn(2, 6), new Pawn(3, 6),
    new Pawn(4, 6), new Pawn(5, 6), new Pawn(6, 6), new Pawn(7, 6),
    new Rook(0, 7), new Rook(7, 7),
    new Bishop(2, 7), new Bishop(5, 7),
    new Knight(1, 7), new Knight(6, 7),
    new Queen(3, 7), new King(4, 7),

    new Pawn(0, 1), new Pawn(1, 1), new Pawn(2, 1), new Pawn(3, 1),
    new Pawn(4, 1), new Pawn(5, 1), new Pawn(6, 1), new Pawn(7, 1),
    new Rook(0, 0), new Rook(7, 0),
    new Bishop(2, 0), new Bishop(5, 0),
    new Knight(1, 0), new Knight(6, 0),
    new Queen(3, 0), new King(4, 0),
);
game.clientTurn = null;

socket.on('update', (data) => {
    let { piece: id, x, y, check } = data
    let p = game.pieces[id]

    game.addMoveTrail(p.x, p.y, x, y)
    p.makeMove(x, y, true)
    p.render()

    game.serverTurn.king.div.className = game.serverTurn.king.class
    game.serverTurn = game.clientTurn

    if (check)
        game.serverTurn.king.div.className = game.serverTurn.king.class + ' check'
    else
        game.serverTurn.king.div.className = game.serverTurn.king.class



})
socket.on('ready', (i) => {
    game.setTurn(i)
    game.moveMade = function (p, x, y) {
        socket.emit('update', { piece: p.rid, x, y, check: false })
    }
    game.checkMate = function (p, x, y) {
        socket.emit('game-end', { piece: p.rid, x, y }, 1)
    }
    game.checkMade = function (p, x, y) {
        socket.emit('update', { piece: p.rid, x, y, check: true })
    }

    resign.style.display = 'block'
    // socket.emit('update', p1)
})
socket.on('soft-leave', () => {
    game.removeHighlights()
    game.clientTurn = null;
    resign.style.display = 'none'
})
socket.on('hard-leave', () => {
    game.removeHighlights()
    connected = undefined;
    game.clientTurn = null;
    resign.style.display = 'none'
})
var winsText = document.getElementById('wins')
var lossesText = document.getElementById('losses')
var wins = 0, losses = 0
winsText.innerHTML = `WINS:   ${wins}`
lossesText.innerHTML = `LOSSES: ${losses}`

socket.on('game-end', (data, w, l) => {
    wins = w; losses = l
    winsText.innerHTML = `WINS:   ${wins}`
    lossesText.innerHTML = `LOSSES: ${losses}`



    if (data) {
        let { piece: id, x, y } = data
        let p = game.pieces[id]
        game.addMoveTrail(p.x, p.y, x, y)

        p.makeMove(x, y, true)
        p.render()
    }
    game.removeHighlights()
    connected = undefined;
    game.clientTurn = null;

    resign.style.display = 'none'
    socket.emit('game-end2')
})



var connected;
socket.on('join', (r) => {
    connected = r

    game = new Game(
        new Pawn(0, 6), new Pawn(1, 6), new Pawn(2, 6), new Pawn(3, 6),
        new Pawn(4, 6), new Pawn(5, 6), new Pawn(6, 6), new Pawn(7, 6),
        new Rook(0, 7), new Rook(7, 7),
        new Bishop(2, 7), new Bishop(5, 7),
        new Knight(1, 7), new Knight(6, 7),
        new Queen(3, 7), new King(4, 7),

        new Pawn(0, 1), new Pawn(1, 1), new Pawn(2, 1), new Pawn(3, 1),
        new Pawn(4, 1), new Pawn(5, 1), new Pawn(6, 1), new Pawn(7, 1),
        new Rook(0, 0), new Rook(7, 0),
        new Bishop(2, 0), new Bishop(5, 0),
        new Knight(1, 0), new Knight(6, 0),
        new Queen(3, 0), new King(4, 0),
    );
    game.clientTurn = null;
})

var signIn = document.getElementsByClassName('g-signin2')[0]
var signInImg = document.getElementById('signin-img')
var signInName = document.getElementById('signin-p')
var signInButton = document.getElementById('signin-button')

var nickname;

const clientID = "894823189716 - ccnva78uf040snt722ah99culli84b12.apps.googleusercontent.com"
var google, googleU;


async function onSignIn(googleUser) {
    signIn.firstChild.firstChild.children[1].display = 'none'
    signIn.firstChild.style.width = '36px'

    var profile = googleUser.getBasicProfile();
    // signIn.style.display = 'none'
    signInImg.src = profile.getImageUrl()
    signInImg.style.display = 'inline-block'

    nickname = profile.getName()
    signInName.innerHTML = nickname
    signInName.style.display = 'inline-block'

    // signIn.style.display = 'none'
    signInButton.style.display = 'inline-block'


    render(Rooms)
    signInButton.onclick = async () => {
        google = gapi.auth2.getAuthInstance()
        await google.disconnect()
        await google.signOut()


        signIn.firstChild.firstChild.children[1].display = 'inline-block'
        signIn.firstChild.style.width = '120px'

        nickname = undefined
        signInImg.style.display = 'none'

        signInName.style.display = 'none'
        signInName.innerHTML = ''

        signIn.style.display = 'inline-block'
        signInButton.style.display = 'none'

        socket.emit('leave')
        render(Rooms)
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
    button.className = 'game'
    if (connected === undefined || connected != i)
        button.className += ' join'
    button.innerHTML = '<div></div><div></div>'

    if (nickname !== undefined && (connected == i || clients.length < 2))
        button.className += ' able'

    button.addEventListener('click', () => {
        if (nickname !== undefined && (connected == i || clients.length < 2)) {
            if (connected === undefined || connected != i)
                socket.emit('join', nickname, i)
            else
                socket.emit('leave')
        }
    })
    div.appendChild(button)
    return div
}
var roomsWrapper = document.getElementById('rooms-wrapper')

var Rooms = []
socket.on('rooms', (rooms) => {
    Rooms = rooms
    render(rooms)
})
function render(rooms) {
    while (roomsWrapper.firstChild) {
        roomsWrapper.removeChild(roomsWrapper.firstChild);
    }

    for (let i in rooms)
        roomsWrapper.appendChild(roomDiv(`Game #${i}`, i, ...rooms[i]))

    let button = document.createElement('div')
    button.id = 'new-game'
    button.className = 'game'
    if (nickname !== undefined)
        button.className += ' able'
    button.innerHTML = '<div></div><div></div>'
    button.onclick = () => { if (nickname !== undefined) socket.emit('join', nickname) }
    roomsWrapper.appendChild(button)
}
render()

var resign = document.getElementById('resign')
var userdata = document.getElementById('userdata')

resign.style.display = 'none'
resign.addEventListener('click', () => {
    socket.emit('game-end', undefined, 2)
})
// Comments for forcing changes
/*
    CHANGE COUNT: 2
*/