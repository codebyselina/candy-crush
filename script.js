
const ROWS = 7;
const COLS = 8;

const CANDIES = ["🍓", "🍊", "🍋", "🍏", "🍇", "🫐"];

const TARGET = 1000;
const START_MOVES = 30;

const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const movesElement = document.getElementById("moves");
const messageElement = document.getElementById("message");

let board = [];
let score = 0;
let moves = START_MOVES;
let selected = null;
let busy = false;
let finished = false;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const randomCandy = () =>
    Math.floor(Math.random() * CANDIES.length);

function index(row, col) {
    return row * COLS + col;
}

// CREATE BOARD
function makeBoard() {
    board = Array.from(
        { length: ROWS * COLS },
        randomCandy
    );

    let matches = findMatches();

    while (matches.length) {
        matches.forEach(i => {
            board[i] = randomCandy();
        });

        matches = findMatches();
    }

    drawBoard();
}

// DISPLAY BOARD
function drawBoard() {
    boardElement.innerHTML = "";

    board.forEach((candy, i) => {
        const cell = document.createElement("button");

        cell.className = "cell";
        cell.type = "button";
        cell.textContent = CANDIES[candy];

        if (selected === i) {
            cell.classList.add("selected");
        }

        cell.addEventListener("click", () => {
            selectCandy(i);
        });

        boardElement.appendChild(cell);
    });

    scoreElement.textContent = score.toLocaleString();
    movesElement.textContent = moves;
}

// FIND MATCHES
function findMatches() {
    const matches = new Set();

    // Horizontal matching
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 2; c++) {

            const type = board[index(r, c)];

            if (type === null) continue;

            let end = c;

            while (
                end + 1 < COLS &&
                board[index(r, end + 1)] === type
            ) {
                end++;
            }

            if (end - c + 1 >= 3) {
                for (let x = c; x <= end; x++) {
                    matches.add(index(r, x));
                }

                c = end;
            }
        }
    }

    // Vertical matching
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 2; r++) {

            const type = board[index(r, c)];

            if (type === null) continue;

            let end = r;

            while (
                end + 1 < ROWS &&
                board[index(end + 1, c)] === type
            ) {
                end++;
            }

            if (end - r + 1 >= 3) {
                for (let y = r; y <= end; y++) {
                    matches.add(index(y, c));
                }

                r = end;
            }
        }
    }

    return [...matches];
}

// CHECK ADJACENT CANDIES
function adjacent(a, b) {
    const rowA = Math.floor(a / COLS);
    const rowB = Math.floor(b / COLS);

    const colA = a % COLS;
    const colB = b % COLS;

    return (
        Math.abs(rowA - rowB) +
        Math.abs(colA - colB) === 1
    );
}

// SELECT CANDY
async function selectCandy(i) {
    if (busy || finished) return;

    if (selected === null) {
        selected = i;
        drawBoard();
        return;
    }

    if (selected === i) {
        selected = null;
        drawBoard();
        return;
    }

    if (!adjacent(selected, i)) {
        selected = i;
        drawBoard();
        return;
    }

    const first = selected;
    selected = null;

    await swapCandies(first, i);
}

// SWAP CANDIES
async function swapCandies(a, b) {
    busy = true;

    [board[a], board[b]] = [board[b], board[a]];

    drawBoard();

    await wait(130);

    // Reverse invalid swaps
    if (!findMatches().length) {
        [board[a], board[b]] = [board[b], board[a]];

        messageElement.textContent =
            "No match! Try a different swap.";

        drawBoard();

        busy = false;
        return;
    }

    moves--;

    await clearMatches();

    busy = false;

    checkGameEnd();
}

// CLEAR MATCHED CANDIES
async function clearMatches() {
    let matches = findMatches();

    while (matches.length) {

        matches.forEach(i => {
            boardElement.children[i]?.classList.add("pop");
        });

        score += matches.length * 10;

        scoreElement.textContent = score.toLocaleString();

        messageElement.textContent =
            "Great! Keep crushing! 🍬";

        await wait(230);

        // Remove matched candies
        matches.forEach(i => {
            board[i] = null;
        });

        // Apply gravity
        for (let c = 0; c < COLS; c++) {

            const remaining = [];

            for (let r = ROWS - 1; r >= 0; r--) {
                const value = board[index(r, c)];

                if (value !== null) {
                    remaining.push(value);
                }
            }

            // Fill empty spaces with new candies
            for (let r = ROWS - 1; r >= 0; r--) {
                board[index(r, c)] =
                    remaining[ROWS - 1 - r] ?? randomCandy();
            }
        }

        drawBoard();

        await wait(160);

        // Check cascading matches
        matches = findMatches();
    }
}

// CHECK WIN / GAME OVER
function checkGameEnd() {

    if (score >= TARGET) {
        finished = true;

        messageElement.textContent =
            "🎉 You won! Sweet victory!";

    } else if (moves <= 0) {
        finished = true;

        messageElement.textContent =
            "Game over! Press Restart to try again.";
    }
}

// RESTART GAME
function restartGame() {
    score = 0;
    moves = START_MOVES;

    selected = null;
    busy = false;
    finished = false;

    messageElement.textContent =
        "Match 3 or more candies!";

    makeBoard();
}

document.getElementById("restart")
    .addEventListener("click", restartGame);

// START GAME
makeBoard();
