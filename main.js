const port = window.location.hostname ==
    "nichowas.github.io" ?
    'https://nickdevserver.herokuapp.com/' :
    'http://localhost:3000';
var socket = io.connect(port);

var signIn = document.getElementsByClassName('g-signin2')[0]
var signInImg = document.getElementById('signin-img')
var signInName = document.getElementById('signin-p')
var signInButton = document.getElementById('signin-button')

var roomsWrapper = document.getElementById('rooms')

var userdata = document.getElementById('userdata')
var winsText = document.getElementById('wins')
var lossesText = document.getElementById('losses')

var resign = document.getElementById('resign')

var promKnight = document.getElementById('promotion')
var promKnight = document.getElementById('promotion-knight')
var promBishop = document.getElementById('promotion-bishop')
var promRook = document.getElementById('promotion-rook')
var promQueen = document.getElementById('promotion-queen')

var usersWrapper = document.getElementById('online-users')

var game;
var wins = 0, losses = 0;
var connected, nickname = 'guest', googleID, imageSrc;
var Rooms = [], Users = [];

socket.on('start', (users) => {
    Users = users
    render(Rooms, users)

    socket.on('rooms', (rooms) => {
        Rooms = rooms
        render(rooms, Users)
    })
    socket.on('users', (users) => {
        Users = users
        render(Rooms, users)
    })
    socket.on('user-signin', (w, l) => {
        Users = users
        render(Rooms, users)
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
            }, 2)
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
    socket.on('game-end', (data, w = null, l) => {
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
            game.serverTurn.king.div.className = game.serverTurn.king.class
            if (check)
                game.clientTurn.king.div.className = game.clientTurn.king.class + ' check'
            else
                game.clientTurn.king.div.className = game.clientTurn.king.class
        }
        game.removeHighlights()
        game.allowMove = false
        connected = undefined;

        resign.style.display = 'none'
    })
    nickname = 'Guest'
    signInName.style.display = 'inline-block'
    signInImg.style.display = 'inline-block'

    signInName.innerHTML = 'Playing as GUEST'
    signInImg.src = 'guest.svg'

    socket.emit('guest-signin')
})

async function onSignIn(googleUser) {
    googleID = googleUser.getId()
    signIn.firstChild.firstChild.children[1].display = 'none'
    signIn.firstChild.style.width = '36px'

    var profile = googleUser.getBasicProfile();
    // signIn.style.display = 'none'
    imageSrc = profile.getImageUrl()

    signInImg.src = imageSrc
    signInImg.style.display = 'inline-block'

    nickname = profile.getName()
    signInName.innerHTML = nickname
    signInName.style.display = 'inline-block'

    // signIn.style.display = 'none'
    signInButton.style.display = 'inline-block'
    socket.emit('user-signin', googleID, nickname, imageSrc)

    userdata.style.display = 'block'

    render(Rooms, Users)
    signInButton.onclick = () => signOut(google = gapi.auth2.getAuthInstance())
}
async function signOut(google) {
    await google.disconnect()
    await google.signOut()

    userdata.style.display = 'none'

    signIn.firstChild.firstChild.children[1].display = 'inline-block'
    signIn.firstChild.style.width = '120px'

    nickname = 'Guest'
    googleID = undefined
    signInImg.src = 'guest.svg'

    // signInName.style.display = 'none'
    signInName.innerHTML = 'Playing as GUEST'

    signIn.style.display = 'inline-block'
    signInButton.style.display = 'none'

    socket.emit('user-signout')
    render(Rooms, Users)
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
        if (nickname !== undefined && (connected == i || clients.length < 2))
            if (connected === undefined || connected != i)
                socket.emit('join', i)
            else
                if (clients.length < 2)
                    socket.emit('leave')
                else
                    socket.emit('game-end', undefined, 0)
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

    let wrap = document.createElement('div')
    wrap.className = 'room-users'

    div.className = 'room'
    div.innerHTML = r
    for (let c of clients) {
        wrap.appendChild(clientDiv(c))
    }
    div.appendChild(wrap)

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

function userDiv(u, i) {
    let div = document.createElement('div')
    div.className = `user place-${Number(i) + 1}`

    div.innerHTML =
        `<img src = ${u.src} class = "user-img"><div class = 'online-indicator ${u.online ? 'online' : 'offline'}'></div>
        <span>${u.name}</span><span>${u.rating}</span>`

    return div
}

function render(rooms = [], users = []) {
    while (roomsWrapper.firstChild) { roomsWrapper.removeChild(roomsWrapper.firstChild); }
    while (usersWrapper.firstChild) { usersWrapper.removeChild(usersWrapper.firstChild); }

    for (let i in rooms) roomsWrapper.appendChild(roomDiv(`Game #${i} `, i, ...rooms[i]))

    let nbutton = document.createElement('div')
    nbutton.innerHTML = '<div></div><div></div>'; nbutton.onclick = newGame()
    nbutton.id = 'new-game'; nbutton.className = `game ${nickname === undefined ? '' : 'able'} `
    roomsWrapper.appendChild(nbutton)


    for (let i in users) usersWrapper.appendChild(userDiv(users[i], i))
}

// winsText.innerHTML = `WINS: ${ wins } `
// lossesText.innerHTML = `LOSSES: ${ losses } `

resign.style.display = 'none'
resign.onclick = () => socket.emit('game-end', undefined, 0)

render()

// Comments for forcing changes
/*
    CHANGE COUNT: 2
*/
