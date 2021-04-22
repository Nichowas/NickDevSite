const board = document.getElementById('board')
const wgraveyard = document.getElementById('wgraveyard')
const bgraveyard = document.getElementById('bgraveyard')


class Game {
    static valueMap = {
        Pawn: 1,
        Knight: 3,
        Bishop: 3,
        Rook: 5,
        Queen: 9
    }
    constructor(...ps) {
        // this.box = board.getBoundingClientRect()
        this.box = {
            // left: this.box.left + document.body.scrollLeft,
            // top: this.box.top + document.body.scrollTop
            left: 0, top: 0
        }

        this.White = { label: 'white' }
        this.Black = { label: 'black', not: this.White }
        this.White.not = this.Black

        this.serverTurn = this.White
        this.pieces = ps;

        this.passant = null;
        let i = 0
        this.pieces.forEach(p => { if (p) p.init(this, i < 16 ? this.White : this.Black, i); i++ })
        this.wgraveyard = []
        this.bgraveyard = []
        this.renderGraveyard()

        let highlights = document.getElementsByClassName('highlight')
        while (highlights.length > 0) board.removeChild(highlights[0])

        this.prom = false
    }
    renderGraveyard() {

        let sorted = this.wgraveyard.sort((a, b) => Game.valueMap[b.type] - Game.valueMap[a.type])
        while (wgraveyard.firstChild) wgraveyard.removeChild(wgraveyard.firstChild)
        for (let i in sorted) {
            let w = sorted[i]
            let src = `PieceImages/white-${w.type.toLowerCase()}.svg`

            let div = document.createElement('img')
            div.className = `graveyard-piece`
            div.src = src

            wgraveyard.appendChild(div)
        }

        sorted = this.bgraveyard.sort((a, b) => Game.valueMap[b.type] - Game.valueMap[a.type])
        while (bgraveyard.firstChild) bgraveyard.removeChild(bgraveyard.firstChild)
        for (let i in sorted) {
            let b = sorted[i]
            let src = `PieceImages/black-${b.type.toLowerCase()}.svg`

            let div = document.createElement('img')
            div.className = `graveyard-piece`
            div.src = src

            bgraveyard.appendChild(div)
        }
    }
    setTurn(cturn) {
        this.clientTurn = cturn === 'black' ? this.Black : this.White;
    }
    removeHighlights() {
        if (this.highlight)
            for (let h of this.highlight) h.remove()
        this.highlight = undefined
    }
    pieceAt(x, y, ps = false) {
        if (!ps) ps = this.pieces
        return ps.find(p => p && p.x == x && p.y == y)
    }
    inCheck(king, x, y) {
        if (x === undefined) { x = king.x; y = king.y }
        // Check all pieces of opponents moves for [x, y]
        let ops = this.pieces.filter(p => p && p.player !== king.player), count = 0
        for (let i = 0; i < ops.length; i++) {
            if (ops[i].getMoves(false).find(m => m[0] == x && m[1] == y)) {
                count++
            }
        }
        return count
    }
    illegal(p, x, y) {
        if (x < 0 || y < 0 || x > 7 || y > 7) return true
        let P = this.pieceAt(x, y)
        if (P && P.player === p.player) return true

        let cx = p.x, cy = p.y
        let taken = p.makeMove(x, y)
        let count = this.inCheck(p.player.king)

        // unmake move
        p.x = cx; p.y = cy
        if (taken) this.pieces[taken.rid] = taken

        return count > 0
    }
    findCheck() {
        let check = this.inCheck(this.serverTurn.king) ? 1 : 0
        let noptions = this.pieces
            .filter(p => p && p.player === this.serverTurn)
            .reduce((a, p) => p ? a + p.getMoves().length : a, 0) ? 0 : 2
        return check + noptions
        // 0 + 0 (no check    options)    => 0 (valid)
        // 1 + 0 (check       options)    => 1 (check)
        // 0 + 2 (no check    no options) => 2 (stalemate)
        // 1 + 2 (check       no options) => 3 (checkmate)
    }
    position(x, y) {
        return [
            this.box.left + x * 40,
            this.box.top + y * 40
        ]
    }
    addMoveTrail(x, y, mx, my) {
        if (this.fromHighlight) board.removeChild(this.fromHighlight)
        if (this.toHighlight) board.removeChild(this.toHighlight)

        let fromHighlight = document.createElement('div')
        fromHighlight.className = 'highlight highlight-move';
        let [l, t] = this.position(x, y)
        fromHighlight.style.left = l + 'px'
        fromHighlight.style.top = t + 'px'

        let toHighlight = document.createElement('div')
        toHighlight.className = 'highlight highlight-move';
        [l, t] = this.position(mx, my)
        toHighlight.style.left = l + 'px'
        toHighlight.style.top = t + 'px'

        board.appendChild(fromHighlight)
        board.appendChild(toHighlight)
        this.fromHighlight = fromHighlight; this.toHighlight = toHighlight;
    }
}
class Piece {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = this.constructor.name
    }
    init(game, pl, id) {
        this.player = pl

        this.game = game
        this.rid = id
        this.id = `piece#${id}`
        this.div = document.getElementById(this.id)
        this.div.onclick = (e) => this.onclick(e)
        this.class = this.div.className

        this.render()
    }
    makeMove(x, y, fr = false) {
        let p = this.game.pieceAt(x, y)
        if (p) {
            p.remove(fr)
        }
        if (fr) {
            this.game.passant = null
        }

        this.x = x; this.y = y
        return p
    }
    remove(fr) {
        if (fr) {
            if (this.player === this.game.White)
                this.game.wgraveyard.push(this)
            else
                this.game.bgraveyard.push(this)

            this.game.renderGraveyard()
            this.div.style.display = 'none'
        }
        this.game.pieces[this.rid] = null;
    }
    render() {
        this.div.style.display = 'block'
        this.div.src = `PieceImages/${this.player.label}-${this.type.toLowerCase()}.svg`
        let [l, t] = this.game.position(this.x, this.y)
        this.div.style.left = l + 'px'
        //74
        this.div.style.top = t + 'px'
    }
    onclick(e) {
        this.game.removeHighlights()
        if (!this.game.allowMove || this.game.clientTurn !== this.game.serverTurn || this.game.clientTurn !== this.player) return

        let moves = this.getMoves(), h = []
        for (let i = 0; i < moves.length; i++) {
            let highlight = document.createElement('div')
            highlight.className = 'highlight'
            let [l, t] = this.game.position(...moves[i])
            highlight.style.left = l + 'px'
            highlight.style.top = t + 'px'

            highlight.onclick = (e) => this.moveOnClick(e, moves[i])

            board.appendChild(highlight)
            h.push(highlight)
        }
        this.game.highlight = h;

        this.div.onclick = (e) => this.altOnclick(e)
    }
    moveOnClick(e, m) {
        this.game.addMoveTrail(this.x, this.y, ...m)


        this.game.removeHighlights()
        this.makeMove(...m, true)
        this.moveOnClick2(m, this.game.prom)
    }
    moveOnClick2(m, prom = false) {
        this.render()
        if (prom) {
            let promCall
            this.div.onclick = () => { }
            if (this.game.promotionMade) promCall = this.game.promotionMade(this)

            this.game.onPromote = (type) => {
                this.game.chosenPromotion = type.name.toLowerCase()
                let promPiece = this.promote(type, ...m);
                promCall()

                promPiece.moveOnClick2(m)
                this.game.prom = false
            }
            return
        }
        if (!this.game.prom)
            this.game.chosenPromotion = null

        this.div.onclick = (e) => this.onclick(e)

        this.game.serverTurn = this.game.clientTurn.not

        let check = this.game.findCheck()
        switch (check) {
            case 0: // normal move
                this.game.serverTurn.king.div.className = this.game.serverTurn.king.class
                this.game.clientTurn.king.div.className = this.game.clientTurn.king.class

                if (this.game.moveMade)
                    this.game.moveMade(this, ...m)
                break

            case 1: // check
                this.game.serverTurn.king.div.className = this.game.serverTurn.king.class + ' check'
                this.game.clientTurn.king.div.className = this.game.clientTurn.king.class
                if (this.game.checkMade)
                    this.game.checkMade(this, ...m)
                break

            case 2: // stalemate
                this.game.serverTurn.king.div.className = this.game.serverTurn.king.class
                this.game.clientTurn.king.div.className = this.game.clientTurn.king.class
                if (this.game.checkMate)
                    this.game.checkMate(this, ...m)
                break

            case 3: // checkmate
                this.game.serverTurn.king.div.className = this.game.serverTurn.king.class + ' check'
                this.game.clientTurn.king.div.className = this.game.clientTurn.king.class
                if (this.game.checkMate)
                    this.game.checkMate(this, ...m)
                break
        }
    }
    altOnclick(e) {
        this.game.removeHighlights()
        this.div.onclick = (e) => this.onclick(e)
    }
}
class Rook extends Piece {
    constructor(x, y) {
        super(x, y)
        this.moved = false
    }
    makeMove(x, y, fr = false) {
        let p = this.game.pieceAt(x, y)
        if (p) {
            p.remove(fr)
        }
        if (fr) {
            this.game.passant = null
            this.moved = true
        }

        this.x = x; this.y = y
        return p
    }
    getMoves(illegalCheck = true) {
        let hb = false, vb = false;
        let moves = [], x, y, off, p
        for (let i = 0; i < 7; i++) {
            // Horizontal
            off = i < this.x ? (-i - 1) : (1 + i - this.x)
            x = this.x + off, y = this.y;

            if (off == 1) hb = false
            p = this.game.pieceAt(x, y)
            if (p) {
                if (!hb && p.player !== this.player) moves.push([x, y])
                hb = true
            }
            if (!hb) moves.push([x, y])

            // Vertical
            off = i < this.y ? (-i - 1) : (1 + i - this.y)
            x = this.x, y = this.y + off;

            if (off == 1) vb = false
            p = this.game.pieceAt(x, y)
            if (p) {
                if (!vb && p.player !== this.player) moves.push([x, y])
                vb = true
            }
            if (!vb) moves.push([x, y])
        }

        if (illegalCheck) moves = moves.filter(m => !this.game.illegal(this, ...m))

        return moves
    }
}
class Bishop extends Piece {
    getMoves(illegalCheck = true) {
        let block = false;
        let moves = [], x, y, off, p

        // Positive Line
        for (let i = 0; i < (7 - Math.abs(this.x - this.y)); i++) {
            off = this.x < this.y ?
                (i < this.x ? (-i - 1) : (1 + i - this.x)) :
                (i < this.y ? (-i - 1) : (1 + i - this.y))
            x = this.x + off, y = this.y + off

            if (off == 1) block = false
            p = this.game.pieceAt(x, y)
            if (p) {
                if (!block && p.player !== this.player) moves.push([x, y])
                block = true
            }
            if (!block) moves.push([x, y])
        }
        block = false
        // Negative Line
        for (let i = 0; i < (7 - Math.abs(this.x + this.y - 7)); i++) {
            let iy = 7 - this.y
            off = this.x < iy ?
                (i < this.x ? (-i - 1) : (1 + i - this.x)) :
                (i < iy ? (-i - 1) : (1 + i - iy))
            x = this.x + off, y = this.y - off

            if (off == 1) block = false
            p = this.game.pieceAt(x, y)
            if (p) {
                if (!block && p.player !== this.player) moves.push([x, y])
                block = true
            }
            if (!block) moves.push([x, y])
        }

        if (illegalCheck) moves = moves.filter(m => !this.game.illegal(this, ...m))

        return moves
    }
}
class Queen extends Piece {
    getMoves(illegalCheck = true) {
        let hb = false, vb = false, block = false;
        let moves = [], x, y, off, p

        // Positive Line
        for (let i = 0; i < (7 - Math.abs(this.x - this.y)); i++) {
            off = this.x < this.y ?
                (i < this.x ? (-i - 1) : (1 + i - this.x)) :
                (i < this.y ? (-i - 1) : (1 + i - this.y))
            x = this.x + off, y = this.y + off

            if (off == 1) block = false
            p = this.game.pieceAt(x, y)
            if (p) {
                if (!block && p.player !== this.player) moves.push([x, y])
                block = true
            }
            if (!block) moves.push([x, y])
        }
        block = false
        // Negative Line
        for (let i = 0; i < (7 - Math.abs(this.x + this.y - 7)); i++) {
            let iy = 7 - this.y
            off = this.x < iy ?
                (i < this.x ? (-i - 1) : (1 + i - this.x)) :
                (i < iy ? (-i - 1) : (1 + i - iy))
            x = this.x + off, y = this.y - off

            if (off == 1) block = false
            p = this.game.pieceAt(x, y)
            if (p) {
                if (!block && p.player !== this.player) {
                    moves.push([x, y])
                }
                block = true
            }
            if (!block) moves.push([x, y])
        }

        // Horizontal/Vertical
        for (let i = 0; i < 7; i++) {
            // Horizontal
            off = i < this.x ? (-i - 1) : (1 + i - this.x)
            x = this.x + off, y = this.y;

            if (off == 1) hb = false
            p = this.game.pieceAt(x, y)
            if (p) {
                if (!hb && p.player !== this.player) moves.push([x, y])
                hb = true
            }
            if (!hb) moves.push([x, y])

            // Vertical
            off = i < this.y ? (-i - 1) : (1 + i - this.y)
            x = this.x, y = this.y + off;

            if (off == 1) vb = false
            p = this.game.pieceAt(x, y)
            if (p) {
                if (!vb && p.player !== this.player) moves.push([x, y])
                vb = true
            }
            if (!vb) moves.push([x, y])
        }

        if (illegalCheck) moves = moves.filter(m => !this.game.illegal(this, ...m))

        return moves
    }
}
class Knight extends Piece {
    getMoves(illegalCheck = true) {
        let moves = [], ox = 1, oy = 2, x, y, p
        for (let i = 0; i < 8; i++) {
            if (i % 2 == 0) {
                if (ox * oy > 0) { let c = oy; oy = ox; ox = c }
                if (ox * oy < 0) { let c = oy; oy = -ox; ox = -c }

            } else {
                if (oy == 1 || oy == -1) oy *= -1
                if (ox == 1 || ox == -1) ox *= -1
            }
            x = this.x + ox, y = this.y + oy
            if (x >= 0 && y >= 0 && x <= 7 && y <= 7) {
                p = this.game.pieceAt(x, y)
                if (!p || p.player !== this.player) moves.push([x, y])
            }

        }

        if (illegalCheck) moves = moves.filter(m => !this.game.illegal(this, ...m))

        return moves
    }
}
class Pawn extends Piece {
    constructor(x, y) {
        super(x, y)
        this.first = true
    }
    makeMove(x, y, fr = false) {
        let p = this.game.pieceAt(x, y)
        let dir = this.player == this.game.Black ? 1 : -1

        // En Passant
        if (!p && (y == this.y + dir) && (x == this.x - 1 || x == this.x + 1)) p = this.game.pieceAt(x, y - dir)

        if (p) {
            p.remove(fr)
        }

        if (fr) {
            this.first = false
            if (y == this.y + 2 * dir) {
                this.game.passant = this
            } else {
                this.game.passant = null
            }
            if (y === 0 || y === 7) {
                this.game.prom = true
            }
        }

        this.x = x; this.y = y
        return p
    }
    getMoves(illegalCheck = true) {
        let moves = [], dir = this.player === this.game.Black ? 1 : -1
        if (this.y == 7 && this.player === this.game.Black || this.y == 0 && this.player === this.game.White) return []

        // Move 1 square forward
        let front = this.game.pieceAt(this.x, this.y + dir)
        if (!front) moves.push([this.x, this.y + dir])

        // Move 2 square forward
        if (this.first) {
            let sfront = this.game.pieceAt(this.x, this.y + 2 * dir)
            if (!sfront && !front) moves.push([this.x, this.y + 2 * dir])
        }

        // Take left
        if (this.x > 0) {
            let ltake = this.game.pieceAt(this.x - 1, this.y + dir)
            if (ltake && ltake.player !== this.player) moves.push([this.x - 1, this.y + dir])
            // En Passant left 
            let eltake = this.game.pieceAt(this.x - 1, this.y)
            if (eltake && eltake.player !== this.player && eltake === this.game.passant) moves.push([this.x - 1, this.y + dir])
        }
        // Take right
        if (this.x < 7) {
            let rtake = this.game.pieceAt(this.x + 1, this.y + dir)
            if (rtake && rtake.player !== this.player) moves.push([this.x + 1, this.y + dir])
            // En Passant right 
            let ertake = this.game.pieceAt(this.x + 1, this.y)
            if (ertake && ertake.player !== this.player && ertake === this.game.passant) moves.push([this.x + 1, this.y + dir])
        }


        if (illegalCheck) moves = moves.filter(m => !this.game.illegal(this, ...m))

        return moves
    }
    promote(type, x, y) {
        let rid = this.rid, g = this.game
        this.div.className = `piece ${this.player.label} ${type.name.toLowerCase()}`
        let prom = new type(x, y)
        g.pieces[rid] = prom
        prom.init(g, this.player, rid)
        return prom
    }
}
class King extends Piece {
    constructor(x, y) {
        super(x, y)
        this.moved = false
    }
    init(game, pl, id) {
        this.player = pl
        this.game = game
        this.rid = id
        this.id = `piece#${id}`
        this.div = document.getElementById(this.id)
        this.div.onclick = (e) => this.onclick(e)
        this.class = this.div.className

        this.render()

        pl.king = this
    }
    makeMove(x, y, fr = false) {
        let p = this.game.pieceAt(x, y)
        if (p) {
            p.remove(fr)
        }
        if (fr) {
            this.game.passant = null
            this.moved = true
            if (x == this.x + 2) {
                let rook = this.game.pieceAt(7, this.y)
                rook.makeMove(this.x + 1, this.y, true)
                rook.render()
            }
            if (x == this.x - 2) {
                let rook = this.game.pieceAt(0, this.y)
                rook.makeMove(this.x - 1, this.y, true)
                rook.render()
            }
        }

        this.x = x; this.y = y
        return p
    }
    getMoves(illegalCheck = true) {
        let moves = []

        moves.push([this.x - 1, this.y + 1])
        moves.push([this.x + 1, this.y + 1])
        moves.push([this.x, this.y + 1])
        moves.push([this.x - 1, this.y - 1])
        moves.push([this.x + 1, this.y - 1])
        moves.push([this.x, this.y - 1])
        moves.push([this.x - 1, this.y])
        moves.push([this.x + 1, this.y])


        if (!this.moved) {
            let rook
            // Queenside castle
            rook = this.game.pieceAt(0, this.y)
            if (rook && rook instanceof Rook && !rook.moved) {
                let p1 = this.game.pieceAt(this.x - 1, this.y)
                let p2 = this.game.pieceAt(this.x - 2, this.y)

                let ic0 = illegalCheck ? this.game.inCheck(this) : false,
                    ic1 = illegalCheck ? this.game.illegal(this, this.x - 1, this.y) : false,
                    ic2 = illegalCheck ? this.game.illegal(this, this.x - 2, this.y) : false

                if (!ic0 && !p1 && !ic1 && !p2 && !ic2)
                    moves.push([this.x - 2, this.y])
            }

            // Kingside castle
            rook = this.game.pieceAt(7, this.y)
            if (rook && rook instanceof Rook && !rook.moved) {
                let p1 = this.game.pieceAt(this.x + 1, this.y)
                let p2 = this.game.pieceAt(this.x + 2, this.y)

                let ic0 = illegalCheck ? this.game.inCheck(this) : false,
                    ic1 = illegalCheck ? this.game.illegal(this, this.x + 1, this.y) : false,
                    ic2 = illegalCheck ? this.game.illegal(this, this.x + 2, this.y) : false

                if (!ic0 && !p1 && !ic1 && !p2 && !ic2)
                    moves.push([this.x + 2, this.y])
            }

        }

        if (illegalCheck) moves = moves.filter(m => !this.game.illegal(this, ...m))

        return moves
    }
}
