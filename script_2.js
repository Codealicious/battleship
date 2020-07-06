function game_module() {
  const BOARD_SIZE = 100;
  const WIN_HIT_COUNT = 23;

  const SHIP_SIZE = {
    frigate: 4,
    cruiser: 5,
    battleship: 6,
    carrier: 8,
  };

  class Player {
    constructor(id) {
      this.id = id;
      this.hits = [];
      this.misses = [];
      this.guesses = {};
      this.ships = {
        frigate: {
          10: 1,
          11: 1,
          12: 1,
          13: 1,
        },
        cruiser: {
          20: 1,
          30: 1,
          40: 1,
          50: 1,
          60: 1,
        },
        battleship: {
          41: 1,
          42: 1,
          43: 1,
          44: 1,
          45: 1,
          46: 1,
        },
        carrier: {
          19: 1,
          29: 1,
          39: 1,
          49: 1,
          59: 1,
          69: 1,
          79: 1,
          89: 1,
        },
      };
      this.opponentShips = {
        frigate: 0,
        cruiser: 0,
        battleship: 0,
        carrier: 0,
      };
    }
  }

  let cells = document.querySelectorAll(".cell");
  let msgBoard = document.querySelector(".msg");
  let sunkenShip;
  let locked = 1;
  let player;
  let cpu;
  let cpuMod = cpu_module();
  let activePlayer;
  let gameOver;
  let switchPlayer;
  let miss;
  let explosion = new Sound("explosion.mp3");
  let splash = new Sound("splash.wav");

  async function init() {
    console.log("initalizing game...");
    sunkenShip = null;
    player = new Player(1);
    cpu = new Player(0);
    cpuMod.init();
    activePlayer = player.id;
    gameOver = false;
    switchPlayer = false;
    miss = false;
    await displayMsg("start");
    clearMsg();
    console.log("unlocking board...");
    locked = 0;
  }

  function Sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function () {
      this.sound.play();
    };
  }

  function clearBoard(p) {
    console.log(`clearing board for ${p.id ? "player 1" : "CPU"}...`);
    for (let i = 0; i < p.misses.length; i++) {
      cells[p.misses[i]].classList.remove("miss");
    }

    for (let i = 0; i < p.hits.length; i++) {
      cells[p.hits[i]].classList.remove("hit");
    }
  }

  async function changePlayer() {
    if (switchPlayer) {
      console.log("changing players...");
      await displayMsg("switch_player");
      clearMsg();
      clearBoard(!activePlayer ? player : cpu);
      render(activePlayer ? player : cpu);
      switchPlayer = false;
      if (!activePlayer) {
        await transition(1500);
      }
    }
    return new Promise((resolve) => {
      resolve("resolved");
    });
  }

  async function game_driver() {
    if (gameOver) {
      clearBoard(activePlayer ? player : cpu);
      await displayMsg("game_over");
      await transition();
      clearMsg();
      init();
    } else {
      await changePlayer();
      if (activePlayer) {
        locked = 0;
      } else {
        cpuMod.turn();
        locked = 0;
      }
    }
  }

  function isHit(player1, player2, guess) {
    for (ship in player2.ships) {
      if (player2.ships[ship][guess]) {
        player1.opponentShips[ship]++;
        if (player1.opponentShips[ship] === SHIP_SIZE[ship]) {
          sunkenShip = ship;
        }
        return true;
      }
    }
    return false;
  }

  function transition(t) {
    console.log(`waiting ${t} seconds...`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("resolved");
      }, t);
    });
  }

  function updateState(player1, player2, guess) {
    if (!player1.guesses[guess]) {
      player1.guesses[guess] = 1;

      if (isHit(player1, player2, guess)) {
        player1.hits.push(guess);
        if (sunkenShip && player1.hits.length === WIN_HIT_COUNT) {
          gameOver = true;
        }
        explosion.play();
      } else {
        player1.misses.push(guess);
        activePlayer = player2.id;
        switchPlayer = true;
        miss = true;
        splash.play();
      }
    }
  }

  async function displaySunkenMsg() {
    await displayMsg("sunken_ship");
    return new Promise((resolve) => {
      resolve("resolved");
    });
  }

  async function render(p) {
    console.log(`Rendering board for ${p.id ? "player 1" : "CPU"}...`);
    for (let i = 0; i < p.misses.length; i++) {
      cells[p.misses[i]].classList.add("miss");
    }

    for (let i = 0; i < p.hits.length; i++) {
      cells[p.hits[i]].classList.add("hit");
    }

    if (sunkenShip) {
      await displaySunkenMsg();
      clearMsg();
      sunkenShip = null;
    }

    miss ? await transition(1500) : await transition(3500);
    miss = false;

    return new Promise((resolve) => {
      resolve("resolved");
    });
  }

  async function playerGuess(e) {
    console.log("player 1 is guessing...");
    if (!locked) {
      console.log("evaluating player 1's guess");
      locked = 1;
      let guess = e.target.id;
      updateState(player, cpu, guess);
      await render(player);
      game_driver();
    }
  }

  function cpu_module() {
    let guessDirection;
    let directions;
    const leftEdge = {
      9: 1,
      19: 1,
      29: 1,
      39: 1,
      49: 1,
      59: 1,
      69: 1,
      79: 1,
      89: 1,
      99: 1,
    };
    let hitStreak;
    let hitStreakCount;

    function init() {
      console.log("initializing CPU module...");
      guessDirection = -1;
      directions = [null, null, null, null];
      hitStreak = [];
      hitStreakCount = 0;
    }

    function randomNumber(max) {
      return Math.floor(Math.random() * max);
    }

    function randomDirection() {
      guessDirection = randomNumber(4);

      while (directions[guessDirection]) {
        guessDirection = randomNumber(4);
      }

      directions[guessDirection] = 1;

      return guessDirection;
    }

    function getNextGuess(prevHit, direction) {
      switch (direction) {
        case 0:
          return prevHit - 10;
        case 1:
          return prevHit + 1;
        case 2:
          return prevHit + 10;
        case 3:
          return prevHit - 1;
      }
    }

    function getGuess() {
      let guess;

      if (hitStreak.length) {
        if (guessDirection !== -1) {
          guess = getNextGuess(hitStreak[hitStreak.length - 1], guessDirection);
        } else {
          guess = getNextGuess(
            hitStreak[hitStreak.length - 1],
            randomDirection()
          );
        }
      } else {
        guess = randomNumber(BOARD_SIZE);
        while (cpu.guesses[guess]) {
          guess = randomNumber(BOARD_SIZE);
        }
      }

      cpu.guesses[guess] = 1;
      console.log(`CPU is guessing ${guess}`);
      return guess;
    }

    function setPossibleGuessDirections(guess) {
      console.log("setting possible directions...");
      if (guess - 10 < 0 || cpu.guesses[guess - 10]) {
        directions[0] = 1;
      }
      if ((guess + 1) % 10 === 0 || cpu.guesses[guess + 1]) {
        directions[1] = 1;
      }
      if (guess + 10 > 99 || cpu.guesses[guess + 10]) {
        directions[2] = 1;
      }
      if (leftEdge[guess - 1] || cpu.guesses[guess - 1]) {
        directions[3] = 1;
      }
    }

    function hasPossibleDirections(guess) {
      console.log("checking for possible directions...");
      directions = [null, null, null, null];
      setPossibleGuessDirections(guess);
      for (let i = 0; i < directions.length; i++) {
        if (!directions[i]) {
          return true;
        }
      }
      return false;
    }

    function cleanHitStreak() {
      console.log("cleaning the hit stack...");
      guessDirection = -1;
      while (
        hitStreak.length &&
        !hasPossibleDirections(hitStreak[hitStreak.length - 1])
      ) {
        hitStreak.pop();
      }

      hitStreak.length ? (hitStreakCount = 1) : (hitStreakCount = 0);
    }

    function flipDirection(guess) {
      console.log("attempting to flip directions...");
      console.log("pivot: ", guess);
      hitStreakCount = 0;
      switch (guessDirection) {
        case 0:
          if (!(guess + 10 > 99) && !cpu.guesses[guess + 10]) {
            guessDirection = 2;
            hitStreak.push(guess);
            hitStreakCount = 1;
            return true;
          }
          return false;
        case 1:
          if (!leftEdge[guess - 1] && !cpu.guesses[guess - 1]) {
            guessDirection = 3;
            hitStreak.push(guess);
            hitStreakCount = 1;
            return true;
          }
          return false;
        case 2:
          if (!(guess - 10 < 0) && !cpu.guesses[guess - 10]) {
            guessDirection = 0;
            hitStreak.push(guess);
            hitStreakCount = 1;
            return true;
          }
          return false;
        case 3:
          if (!((guess + 1) % 10 === 0) && !cpu.guesses[guess + 1]) {
            guessDirection = 1;
            hitStreak.push(guess);
            hitStreakCount = 1;
            return true;
          }
          return false;
      }
    }

    function checkNextGuess(guess, pivot) {
      console.log(
        `checking next guess in direction: ${guessDirection} w/ guess: ${guess}`
      );
      switch (guessDirection) {
        case 0:
          if (guess - 10 < 0 || cpu.guesses[guess - 10]) {
            return flipDirection(pivot);
          }
          return true;
        case 1:
          if ((guess + 1) % 10 === 0 || cpu.guesses[guess + 1]) {
            return flipDirection(pivot);
          }
          return true;
        case 2:
          if (guess + 10 > 99 || cpu.guesses[guess + 10]) {
            return flipDirection(pivot);
          }
          return true;
        case 3:
          if (leftEdge[guess - 1] || cpu.guesses[guess - 1]) {
            return flipDirection(pivot);
          }
          return true;
      }
    }

    function updateGuessDirection(guess) {
      console.log("updating guess direction....");
      if (guessDirection !== -1) {
        if (
          !checkNextGuess(guess, hitStreak[hitStreak.length - hitStreakCount])
        ) {
          cleanHitStreak();
        }
      } else {
        setPossibleGuessDirections(guess);
      }
    }

    function removeSunkenShip() {
      console.log("removing sunking ship from cpu hit stack...");
      while (
        hitStreak.length &&
        player.ships[sunkenShip][hitStreak[hitStreak.length - 1]]
      ) {
        hitStreak.pop();
      }
    }

    function updateState(player1, player2, guess) {
      console.log("updating state...");
      if (isHit(player1, player2, guess)) {
        console.log("CPU: hit!");
        player1.hits.push(guess);
        hitStreak.push(guess);
        hitStreakCount++;
        explosion.play();
        if (sunkenShip) {
          if (player1.hits.length === WIN_HIT_COUNT) {
            gameOver = true;
          } else {
            removeSunkenShip();
            hitStreakCount = hitStreak.length;
            if (hitStreak.length) {
              if (!flipDirection(hitStreak[0])) {
                cleanHitStreak();
              }
            } else {
              guessDirection = -1;
              directions = [null, null, null, null];
            }
          }
        } else {
          updateGuessDirection(guess);
        }
      } else {
        console.log("CPU miss...");
        console.log("heatStreakCount: ", hitStreakCount);
        if (hitStreak.length > 1) {
          if (!flipDirection(hitStreak[hitStreak.length - hitStreakCount])) {
            cleanHitStreak();
          }
        } else {
          guessDirection = -1;
        }

        player1.misses.push(guess);
        activePlayer = player2.id;
        switchPlayer = true;
        miss = true;
        splash.play();
      }
    }

    async function cpuGuess() {
      console.log("the CPU is taking a turn!");
      let guess = getGuess();
      updateState(cpu, player, guess);
      await render(cpu);
      game_driver();
    }

    return {
      init: init,
      turn: cpuGuess,
    };
  }

  function displayMsg(msg) {
    console.log("displaying msg...");
    switch (msg) {
      case "switch_player":
        msgBoard.innerHTML = `${activePlayer ? "Player 1's" : "CPU's"} Turn`;
        break;
      case "sunken_ship":
        msgBoard.innerHTML =
          `${activePlayer ? "Player 1" : "CPU"} sunk` +
          "<br/>" +
          `${!activePlayer ? "Player 1's" : "CPU's"} ${sunkenShip}`;
        break;
      case "game_over":
        msgBoard.innerHTML =
          "Game Over" + "<br/>" + `${activePlayer ? "Player 1" : "CPU"} Wins!`;
        break;
      default:
        msgBoard.innerHTML = "Player 1 Start!";
    }

    msgBoard.classList.add("active");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("resolved");
      }, 2000);
    });
  }

  function clearMsg() {
    console.log("clearing message...");
    msgBoard.classList.remove("active");
    msgBoard.innerHTML = "";
  }

  return {
    init: init,
    playerGuess: playerGuess,
  };
}

function gameDriver() {
  let game = game_module();
  game.init();
  document.querySelector(".board").addEventListener("click", game.playerGuess);
}

gameDriver();
