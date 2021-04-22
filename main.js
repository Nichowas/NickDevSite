const port = 'https://nickdevserver.herokuapp.com/';
// const port = 'http://localhost:3000';
var socket = io.connect(port);

var winsText = document.getElementById('wins')
var lossesText = document.getElementById('losses')
var signIn = document.getElementsByClassName('g-signin2')[0]
var signInImg = document.getElementById('signin-img')
var signInName = document.getElementById('signin-p')
var signInButton = document.getElementById('signin-button')
var roomsWrapper = document.getElementById('rooms-wrapper')
var resign = document.getElementById('resign')
var userdata = document.getElementById('userdata')

var promKnight = document.getElementById('promotion')
var promKnight = document.getElementById('promotion-knight')
var promBishop = document.getElementById('promotion-bishop')
var promRook = document.getElementById('promotion-rook')
var promQueen = document.getElementById('promotion-queen')

var game;
var wins = 0, losses = 0;
var connected, nickname, googleID;
var Rooms = [];

socket.on('rooms', (rooms) => {
    Rooms = rooms
    render(rooms)
})
socket.on('user-signin', (w, l) => {
    wins = w; losses = l
    winsText.innerHTML = `WINS:   ${wins}`
    lossesText.innerHTML = `LOSSES: ${losses}`
})
socket.on('join', (r, turn) => {
    connected = r

    resetGame(turn)
})
socket.on('ready', () => {
    game.moveMade = function (p, x, y) {
        socket.emit('update', {
            piece: p.rid, x, y,
            check: false, turn: game.clientTurn.label,
            promotion: game.chosenPromotion
        })
    }
    game.checkMate = function (p, x, y) {
        socket.emit('game-end', {
            piece: p.rid, x, y,
            check: true, turn: game.clientTurn.label,
            promotion: game.chosenPromotion
        }, 1)
    }
    game.checkMade = function (p, x, y) {
        socket.emit('update', {
            piece: p.rid, x, y,
            check: true, turn: game.clientTurn.label,
            promotion: game.chosenPromotion
        })
    }
    game.promotionMade = function (p) {
        game.allowMove = false
        promotion.style.display = 'block'
        promKnight.src = `PieceImages/${p.player.label}-knight.svg`
        promBishop.src = `PieceImages/${p.player.label}-bishop.svg`
        promRook.src = `PieceImages/${p.player.label}-rook.svg`
        promQueen.src = `PieceImages/${p.player.label}-queen.svg`

        promKnight.onclick = () => { game.onPromote(Knight); }
        promBishop.onclick = () => { game.onPromote(Bishop); }
        promRook.onclick = () => { game.onPromote(Rook); }
        promQueen.onclick = () => { game.onPromote(Queen); }

        return () => { game.allowMove = true; promotion.style.display = 'none'; }
    }
    game.allowMove = true
    resign.style.display = 'block'
})
socket.on('update', (data) => {
    data = data[data.length - 1]

    let { piece: id, x, y, check, promotion: cp } = data
    let p = game.pieces[id]

    game.addMoveTrail(p.x, p.y, x, y)
    p.makeMove(x, y, true)

    if (cp) {
        p = p.promote({ knight: Knight, bishop: Bishop, rook: Rook, queen: Queen }[cp], x, y)
        game.prom = false
    }
    p.render()

    game.serverTurn.king.div.className = game.serverTurn.king.class
    game.serverTurn = game.clientTurn

    if (check)
        game.serverTurn.king.div.className = game.serverTurn.king.class + ' check'
    else
        game.serverTurn.king.div.className = game.serverTurn.king.class
})
socket.on('leave', () => {
    game.removeHighlights()
    connected = undefined;
    game.allowMove = null;
    resign.style.display = 'none'
})
socket.on('game-end', (data, w, l) => {
    wins = w; losses = l
    winsText.innerHTML = `WINS:   ${wins}`
    lossesText.innerHTML = `LOSSES: ${losses}`

    let lost = data && data.turn !== game.clientTurn.label
    if (lost) {
        let { piece: id, x, y, check, promotion: cp } = data
        let p = game.pieces[id]
        game.addMoveTrail(p.x, p.y, x, y)

        p.makeMove(x, y, true)
        if (cp) {
            p = p.promote({ knight: Knight, bishop: Bishop, rook: Rook, queen: Queen }[cp], x, y)
            game.prom = false
        }
        p.render()
    }
    game.removeHighlights()
    game.allowMove = false
    connected = undefined;

    resign.style.display = 'none'
    socket.emit('game-end2')

    if (lost) {
        game.serverTurn.king.div.className = game.serverTurn.king.class
        if (check)
            game.clientTurn.king.div.className = game.clientTurn.king.class + ' check'
        else
            game.clientTurn.king.div.className = game.clientTurn.king.class
    }
})

async function onSignIn(googleUser) {
    googleID = googleUser.getId()
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
    socket.emit('user-signin', googleID, nickname)

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

function resetGame(turn) {
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
    game.setTurn(turn)
}

function joinGame(clients, i) {
    return (() => {
        if (nickname !== undefined && (connected == i || clients.length < 2)) {
            if (connected === undefined || connected != i)
                socket.emit('join', i)
            else
                socket.emit('leave')
        }
    })
}
function newGame() {
    return (() => {
        if (nickname !== undefined)
            socket.emit('join')
    })
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

    button.onclick = joinGame(clients, i)
    div.appendChild(button)
    return div
}
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
    button.onclick = newGame()
    roomsWrapper.appendChild(button)
}

winsText.innerHTML = `WINS:   ${wins}`
lossesText.innerHTML = `LOSSES: ${losses}`

resign.style.display = 'none'
resign.onclick = () => socket.emit('game-end', undefined, 2)

render()

// Comments for forcing changes
/*
    CHANGE COUNT: 2
*/
