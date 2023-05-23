let Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Events = Matter.Events;

let engine = Engine.create();
let world = engine.world;
let ballColor = 'black';
let boxColor = 'silver';

let render = Render.create({
    canvas: document.getElementById('canvas'),
    engine: engine,
    options: {
        wireframes: false, // Disable wireframe mode
        background: 'white' // Set background color
    }
});

// Set border colors for balls and box
let ballBorderColor = 'yellow';
let boxBorderColor = 'black';

// sounds
let collisionSound = new Audio('/sound/collision.mp3');
let gameOverSound = new Audio('/sound/game-over.mp3');
let winSound = new Audio('/sound/win.mp3');
let touchSound = new Audio('/sound/touch.mp3');
let backgroundSound = new Audio('/sound/background.mp3');


Render.run(render);

// Start the background sound
backgroundSound.loop = true;
backgroundSound.play();

let ground = Bodies.rectangle(400, 610, 810, 20, { isStatic: true });
// let box = Bodies.rectangle(400, 200, 80, 80);
let box = Bodies.rectangle(400, 200, 80, 80, {
    render: {
        fillStyle: boxColor,
        strokeStyle: boxBorderColor, // Set border color for the box
        lineWidth: 5 // Set border width for the box
    }
});
let leftWall = Bodies.rectangle(0, 305, 20, 610, { isStatic: true });
let rightWall = Bodies.rectangle(800, 305, 20, 610, { isStatic: true });
let balls = [];
let goldenBalls = [];
let points = 0;
let isGameOver = false;
let isPointsFull = false;


World.add(world, [ground, box, leftWall, rightWall]);

// Create "Game Over" button
let gameOverButton = document.getElementById('gameOverButton') //document.createElement('button');
// gameOverButton.id = 'gameOverButton';
gameOverButton.innerText = 'Game Over';
gameOverButton.style.display = 'none'; // Initially hidden

document.body.appendChild(gameOverButton);

// Create "You Win" message
let youWinMessage = document.createElement('div');
youWinMessage.id = 'youWinMessage';
youWinMessage.innerText = 'You Win';
youWinMessage.style.display = 'none'; // Initially hidden
youWinMessage.style.position = 'absolute';
youWinMessage.style.color = 'white';
youWinMessage.style.fontSize = '40px';
youWinMessage.style.fontWeight = 'bold';
youWinMessage.style.textAlign = 'center';
youWinMessage.style.width = '100%';
youWinMessage.style.top = '10%';
youWinMessage.style.transform = 'translateY(-50%)';
youWinMessage.style.backgroundColor = 'green'; // Background color
document.body.appendChild(youWinMessage);

// Create "You Lose" message
let youLoseMessage = document.createElement('div');
youLoseMessage.id = 'youLoseMessage';
youLoseMessage.innerText = 'You Lose';
youLoseMessage.style.display = 'none'; // Initially hidden
youLoseMessage.style.position = 'absolute';
youLoseMessage.style.left = '25vw'
youLoseMessage.style.color = 'white';
youLoseMessage.style.fontSize = '40px';
youLoseMessage.style.fontWeight = 'bold';
youLoseMessage.style.textAlign = 'center';
youLoseMessage.style.width = '50%';
youLoseMessage.style.top = '10%';
youLoseMessage.style.transform = 'translateY(-50%)';
youLoseMessage.style.backgroundColor = 'red'; // Background color
document.body.appendChild(youLoseMessage);

// Create point bar container
let pointBarContainer = document.createElement('div');
pointBarContainer.id = 'pointBarContainer';
pointBarContainer.style.width = '100%';
pointBarContainer.style.display = 'flex';
pointBarContainer.style.justifyContent = 'center';
pointBarContainer.style.alignItems = 'center';
document.body.appendChild(pointBarContainer);

// Create point bar
let pointBar = document.createElement('div');
pointBar.id = 'pointBar';
pointBar.style.width = '0';
pointBar.style.height = '10px';
pointBar.style.backgroundColor = 'green';
pointBar.style.border = '2px solid black';
pointBarContainer.appendChild(pointBar);

// Create progress percentage
let progressPercentage = document.createElement('div');
progressPercentage.id = 'progressPercentage';
progressPercentage.style.color = 'black';
progressPercentage.style.fontSize = '20px';
progressPercentage.style.fontWeight = 'bold';
progressPercentage.style.textAlign = 'center';
progressPercentage.style.width = '100%';
progressPercentage.style.backgroundColor = 'white'; // Background color
pointBar.appendChild(progressPercentage);

// Create balls falling on the ground
function createBall(x, y) {
    let ball = Bodies.circle(x, y, 20);
    balls.push(ball);
    World.add(world, ball);
}

// Create Golden balls falling on the ground
function shouldSpawnGoldenBall() {
    // Adjust the probability as needed
    return Math.random() < 0.05; // 5% chance of spawning a golden ball
  }
  

  function createBall(x, y) {
    let ballColor = shouldSpawnGoldenBall() ? 'gold' : 'black';
    
    let ball = Bodies.circle(x, y, 20, {
      render: {
        fillStyle: ballColor,
        strokeStyle: ballBorderColor,
        lineWidth: 10
      }
    });
    
    if (ballColor === 'gold') {
      goldenBalls.push(ball);
    } else {
      balls.push(ball);
    }
    
    World.add(world, ball);
  }
 

  // Remove balls below the ground
function removeBalls() {
    balls = balls.filter(ball => ball.position.y <= 610);
    goldenBalls = goldenBalls.filter(ball => ball.position.y <= 610);
  }
  
    for (let i = 0; i < goldenBalls.length; i++) {
      let ball = goldenBalls[i];
      if (ball.position.y > 610) {
        World.remove(world, ball);
        goldenBalls.splice(i, 1);
        i--;
      }
    }
  
 // Remove balls when they collide with the ground or box
Events.on(engine, 'collisionStart', function (event) {
    let pairs = event.pairs;
    let isCollidingWithBox = false;

    for (let i = 0; i < pairs.length; i++) {
        let pair = pairs[i];

        if (pair.bodyA === ground && balls.includes(pair.bodyB)) {
            removeBall(pair.bodyB);
            increasePoints();
        } else if (pair.bodyB === ground && balls.includes(pair.bodyA)) {
            removeBall(pair.bodyA);
            increasePoints();
        } else if (pair.bodyA === box || pair.bodyB === box) {
            isCollidingWithBox = true;

            if ((pair.bodyA === box && balls.includes(pair.bodyB)) || (pair.bodyB === box && balls.includes(pair.bodyA))) {
                endGame();
                gameOverSound.play();
                break;
            } else if ((pair.bodyA === box && goldenBalls.includes(pair.bodyB)) || (pair.bodyB === box && goldenBalls.includes(pair.bodyA))) {
                removeBall(pair.bodyA === box ? pair.bodyB : pair.bodyA);
                increasePoints();
                if (!isGameOver && !isPointsFull) {
                    setTimeout(decreasePoints, 2000);
                }
                touchSound.play();
            }
        }
    }

    if (!isCollidingWithBox && isGameOver) {
        endGame();
        gameOverSound.play();
    }
});
  

// Keyboard controls
let keys = {};
document.addEventListener('keydown', function (e) {
    keys[e.keyCode] = true;
});

document.addEventListener('keyup', function (e) {
    delete keys[e.keyCode];
});

Events.on(engine, 'beforeUpdate', function () {
    // Move the box left or right
    if (37 in keys) { // Left arrow key
        Body.translate(box, { x: -5, y: 0 });
    } else if (39 in keys) { // Right arrow key
        Body.translate(box, { x: 5, y: 0 });
    }
});

// Generate balls at random positions
let ballInterval = setInterval(function () {
    if (!isGameOver && !isPointsFull) {
        let x = Math.random() * 800 + 100;
        createBall(x, 0);
    }
}, 1000);

// Function to remove a ball from the world
function removeBall(ball) {
    World.remove(world, ball);
    balls = balls.filter(item => item !== ball);
    goldenBalls = goldenBalls.filter(item => item !== ball);
  }



// Remove balls below the ground every frame
Events.on(engine, 'afterUpdate', removeBalls);

// Function to decrease the points
function decreasePoints() {
    // points /= 10;
  }

// Increase points when the box passes the falling balls
function increasePoints() {
    if (!isGameOver && !isPointsFull) {
        points++;
        let pointBarWidth = (points * 10) + 'px';
        pointBar.style.width = pointBarWidth;
        progressPercentage.innerText = Math.floor((points / 80) * 100) + '%';

        if (points % 10 === 0) {
            ballSpawnRate -= 100; // Decrease the ball spawn rate every 10% progress
        }

        if (points >= 80) {
            isPointsFull = true;
            pointBar.style.backgroundColor = 'gold';
            youWinMessage.style.display = 'block';
            restartButton.style.display = 'block';
            pointBarContainer.style.justifyContent = 'center';
            winSound.play();
        }
    }
}


// Function to end the game
function endGame() {
    isGameOver = true;
    clearInterval(ballInterval); // Stop generating balls
    gameOverButton.style.display = 'block';
    youLoseMessage.style.display = 'block'; // Show "You Lose" message
    restartButton.style.display = 'block';
    pointBarContainer.style.justifyContent = 'center';

    // Stop the background sound
    backgroundSound.pause();
    backgroundSound.currentTime = 0;
}
  

// Create "Play Again" button
let restartButton = document.getElementById("restartButton")
restartButton.innerText = 'Play Again';
restartButton.style.display = 'none'; // Initially hidden
restartButton.addEventListener('click', restartGame);
document.body.appendChild(restartButton);

// Function to restart the game
function restartGame() {
    isGameOver = false;
    isPointsFull = false;
    points = 0;
    pointBar.style.width = '0';
    pointBar.style.backgroundColor = 'red';
    gameOverButton.style.display = 'none';
    youWinMessage.style.display = 'none';
    youLoseMessage.style.display = 'none'; // Hide "You Lose" message
    restartButton.style.display = 'none';
  
    // Remove all balls from the world
    balls.forEach(ball => World.remove(world, ball));
    goldenBalls.forEach(ball => World.remove(world, ball));
    balls = [];
    goldenBalls = [];
  
    ballInterval = setInterval(function () {
      if (!isGameOver && !isPointsFull) {
        let x = Math.random() * 800 + 100;
        createBall(x, 0);
      }
    }, 1000);

  }

  
  gameOverButton.addEventListener('click', function () {
    restartGame();
    youLoseMessage.style.display = 'none'; // Hide "You Lose" message

    // Start the background sound
    backgroundSound.loop = true;
    backgroundSound.play();
});

restartButton.addEventListener('click', function () {
    restartGame();
    youLoseMessage.style.display = 'none'; // Hide "You Lose" message

    // Start the background sound
    backgroundSound.loop = true;
    backgroundSound.play();
});


  

Engine.run(engine);




