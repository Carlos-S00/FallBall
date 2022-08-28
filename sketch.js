// P5 documentation at https://p5js.org/reference/
//header('Access-Control-Allow-Origin: *');

let resolution = {x: window.innerWidth, y: window.innerHeight};
let frame = 0;
let colorNum = 0;
let colors = {r: 0 , g: 0, b: 0};
let g;

let backgroundImage;
let backgroundImageCopy;
let gameScreenImage;
let aspectRatio = 3/4;
let heightOfGameScreen;

let ballImage;
let ballStartPosition = {x: .025, y: .05};
let gameBallRatio = .05; // Should this be called ballDiameter instead?
let ballAcc = .00015;
let gravity = .0006;
let maxFallSpeed = .0175;
let maxMoveSpeed = .006;
let ballFric = .94;
let airFric = 1;
let ballFricConst = .0004;
let ballBounce = .009;
let floorEffectSpeed = 1;

let floors = [];
let numOfFloors = 10;
let holesize = gameBallRatio * 3;
let floorSpeed = .0001;

let walls = [];
let wallHeight = .04;
let wallwidth = .03;

//Whenever the window resizes, this function is called with the resolution variable already updated.
function onWindowResize() {
  game.recalcScreen(); //Recalculate the positioning of the game
  game.displayGameBackground(); //Redraw the bricks
  game.drawRainbowCanvas(); //Redraw the rainbow background canvas
  //Anything else you'd want to do...
}


class gameSystem{
  constructor(aspectRatio){
    this.recalcScreen();
  }

  recalcScreen(){
    this.widthOfGameScreen = aspectRatio * resolution.y;
    this.heightOfGameScreen = resolution.y;

    this.position = {
      startX: (resolution.x/2) - (this.widthOfGameScreen/2), 
      startY: 0, 
      endX: (resolution.x/2) + (this.widthOfGameScreen/2),
      endY: resolution.y
    }
  }

  drawRainbowCanvas(){
    console.log("ReCalculating")
    let colorVal = 0;
    let RBGColors = {r: 0, g: 0, b: 0};
    for(let lineHeight = 1; lineHeight <= resolution.y; lineHeight += 2){
      RBGColors = colorFunc(colorVal);
      rainbowCanvas.stroke(RBGColors.r, RBGColors.g, RBGColors.b);
      rainbowCanvas.line(0, lineHeight, resolution.x, lineHeight);
      colorVal += 5;
    }
  }

  displayGameScreen(){
    image(gameScreenImage, this.position.startX, this.position.startY, this.widthOfGameScreen, this.heightOfGameScreen);
  }

  resetImage(images){
    return images.copy(backgroundImageCopy, 0, 0, backgroundImageCopy.width, backgroundImageCopy.height, 0, 0, backgroundImageCopy.width, backgroundImageCopy.height);
  }
  
  displayGameBackground(){
    let currentWidth = 139;
    let currentHeight = 0;

    brickCanvas.clear();
    while(currentHeight <= this.position.endY){
        
      brickCanvas.image(backgroundImage, this.position.startX - currentWidth, currentHeight, 140, 100, 58, 78, 140, 137);
      currentWidth += 139;

      while(this.position.startX - currentWidth > -139){
        brickCanvas.image(backgroundImage, this.position.startX - currentWidth, currentHeight, 140, 100, 58, 78, 140, 137);
        currentWidth += 139;
      }
      currentWidth = 139;
      currentHeight += 100 - 5;
    }

    currentHeight = 0;

    currentWidth = this.position.endX - 1;
    while(currentHeight <= this.position.endY){
      brickCanvas.image(backgroundImage, currentWidth, currentHeight, 140, 100, 58, 78, 140, 137);
      
      while(currentWidth < resolution.x ){
        brickCanvas.image(backgroundImage, currentWidth + 139, currentHeight, 140, 100, 58, 78, 140, 137);
        currentWidth += 139;
      }
      currentWidth = this.position.endX - 1;
      currentHeight += 100 - 5;
    }
  }

  coordToScreen(position){
    let Coordinate = {
      x: this.position.startX + this.perToPx(position.x), 
      y: this.position.startY + this.perToPx(position.y)};
    return Coordinate;
  }

  perToPx(percent){
    return percent * this.widthOfGameScreen;
  }

  displayWall(wall){
    wall.colorNum = this.LineColor(wall.colorNum);
    let startPosition = g.c(wall.topPosition);
    let endPosition = g.c(wall.bottomPosition);

    line(startPosition.x, startPosition.y, endPosition.x, endPosition.y);
  }
  
  displayFloor(floor){
    let startPosition = g.c(floor.startPosition);
    let endPosition = {x: floor.startPosition.x + floor.length, y: startPosition.y};
    endPosition = g.c(endPosition);

    erase();
    line(startPosition.x, startPosition.y, endPosition.x, startPosition.y);
    noErase();
  }

  displayBall(ball){
    let position = g.c(ball.ballPosition);
    let ballDiameter = this.perToPx(ball.ballDiameter);

    translate(position.x, position.y);
    rotate(ball.rotation);
    image(ballImage, -(ballDiameter / 2), -(ballDiameter / 2), ballDiameter, ballDiameter);
    resetMatrix();

    if(position.x - (ballDiameter / 2) < this.position.startX){
      translate(this.position.endX + (position.x -  this.position.startX), position.y);
      rotate(ball.rotation);
      image(ballImage, -(ballDiameter / 2) , -(ballDiameter / 2), ballDiameter, ballDiameter);
      resetMatrix();
    }else if(position.x + (ballDiameter / 2) > this.position.endX){
      translate(this.position.startX - (this.position.endX - position.x), position.y);
      rotate(ball.rotation);
      image(ballImage,  -(ballDiameter / 2) , -(ballDiameter / 2), ballDiameter, ballDiameter);
      resetMatrix();
    }
  }
}

class shortHand{
    constructor(game){
        this.g = game;
    }

    c(position){
        return this.g.coordToScreen(position);
    }

}

class floor{
  constructor(startPosition, length, moveVars, moveFunc){
    this.startPosition = {x: startPosition.x, y: startPosition.y};
    this.length = length;
    this.ball = false;
    this.moveFunc = moveFunc;
    if(moveVars){
      this.moveVars = moveVars;
    }else{
      this.moveVars = false;
    }
  }
    
  moveVertically(){
    this.startPosition.y += this.moveVars.floorVelocity.y;
  }

  moveHorizontally(){
    if(this.moveVars.floorVelocity.x != 0){
      this.startPosition.x += this.moveVars.floorVelocity.x
    }
  }

  doMovement(){
    this.moveFunc();
  }

  checkIfBallOnFloor(ball, nextBallPosition){
    if(nextBallPosition.x >= this.startPosition.x && nextBallPosition.x <= this.startPosition.x + this.length){
      if(ball.onFloor != this){
        if(ball.ballPosition.y  - (ball.ballDiameter / 2) <= this.startPosition.y && nextBallPosition.y + (ball.ballDiameter / 2) - .0025 >= this.startPosition.y){
          this.ball = ball;
          ball.onFloor = this;
          ball.ballVelocity.y = 0;
          ball.ballPosition.y = this.startPosition.y - (this.ballDiameter / 2) - .0025;
          ball.ballPosition.x = nextBallPosition.x;
          ball.rotation += ((40 * (ball.ballVelocity.x)) / (PI * ball.ballDiameter)) * 2 * PI;
          return true;
        }else{
          this.ball = false;
          ball.onFloor = false;
          return false;
        }
      }else{
        return true;
      }
    }else{
      return false;
    }
  }
}


class ball{
  constructor(ballDiameter, ballPosition){
      this.ballDiameter = ballDiameter;
      this.ballPosition = {x: ballPosition.x, y: ballPosition.y};
      this.ballVelocity = {x: 0, y: 0};
      this.onFloor = false;
      this.rotation = 0;
      this.addFloorVelocity = {x: 0, y: 0};
  }

  moveHorizontally(nextXPosition){
    if(keyIsDown(LEFT_ARROW)){

      if(this.ballVelocity.x > -maxMoveSpeed){
        this.ballVelocity.x -= ballAcc;
      }

      if(this.ballVelocity.x > 0){
        this.ballVelocity.x -= ballAcc;
      }

    }else if(keyIsDown(RIGHT_ARROW)){

      if(this.ballVelocity.x < maxMoveSpeed){
        this.ballVelocity.x += ballAcc;
      }

      if(this.ballVelocity.x < 0){
        this.ballVelocity.x += ballAcc;
      }

    }else{
      if(this.onFloor){
        if(this.ballVelocity.x > 0){
          this.ballVelocity.x *= ballFric;
          this.ballVelocity.x -= ballFricConst;
          if(this.ballVelocity.x < 0){
            this.ballVelocity.x = 0;
          }
        }else if(this.ballVelocity.x < 0){
          this.ballVelocity.x *= ballFric;
          this.ballVelocity.x += ballFricConst;
          if(this.ballVelocity.x > 0){
            this.ballVelocity.x = 0;
          }
        }
      }else{//Less friction
        this.ballVelocity.x *= ballFric;
      }
    }

    this.rotation += ((40 * (this.ballVelocity.x)) / (PI * this.ballDiameter)) * 2 * PI;
    nextXPosition += this.ballVelocity.x;

    if(nextXPosition < 0){
      nextXPosition += 1;
    }else if(nextXPosition > 1){
      nextXPosition -= 1;
    }
    return nextXPosition;
  }

  moveVertically(nextYPosition){
    if(!this.onFloor){//gravity
      this.ballVelocity.y += gravity;
      this.ballVelocity.y = Math.min(maxFallSpeed, this.ballVelocity.y);
      return nextYPosition += this.ballVelocity.y;
    }else{
      return nextYPosition;
    }
  }

  newBallPosition(){

  }

  ifBallOnFloor(){

  }

  ifBallNoLongerOnFloor(){

  }

  ifBallOutOfGame(){

  }

  setPositions(nextBallPosition){
    this.ballPosition.x = nextBallPosition.x;
    this.ballPosition.y = nextBallPosition.y;
  }

  doMovement(floors){
    let nextBallPosition = {x: this.ballPosition.x, y: this.ballPosition.y};
    nextBallPosition.y = this.moveVertically(nextBallPosition.y);
    nextBallPosition.x = this.moveHorizontally(nextBallPosition.x);

    if(this.onFloor){
      this.ballPosition.y = this.onFloor.startPosition.y - (this.ballDiameter / 2) - .0025;
      this.ballPosition.x = nextBallPosition.x + this.onFloor.moveVars.floorVelocity.x;
      nextBallPosition = {x: this.ballPosition.x, y: this.ballPosition.y};

      if(!this.onFloor.checkIfBallOnFloor(this, nextBallPosition)){
        this.onFloor = false;
      }
    }
    if(!this.onFloor){
      for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
        if(floors[floorIndex].checkIfBallOnFloor(this, nextBallPosition)){
          break;
        }
      }
    }
    if(!this.onFloor){
      this.setPositions(nextBallPosition);
    }    
  }
}

function colorFunc(colorNum){
  colorNum = colorNum % 1529;
  if(colorNum <= 255){ //0 - 255
      return colors = {r: 255, g: colorNum, b: 0};
    }else if(colorNum <= 510){ // 256 - 510
      return colors = {r: 510 - colorNum, g: 255, b: 0};
    }else if (colorNum <= 765){ // 511 - 765
      return colors = {r: 0, g: 255, b: colorNum - 510};
    }else if(colorNum <= 1020){ //766 - 1020
      return colors = {r: 0, g: 1020 - colorNum, b: 255};
    }else if(colorNum <= 1275){ // 1021 - 1275
      return colors = {r: colorNum - 1020, g: 0, b: 255};
    }else if(colorNum <= 1529){ //1276 - 1529
      return colors = {r: 255, g: 0, b: 1529 - colorNum};
    }else{
      return colors = {r: 255, g: colorNum, b: 0};
    }
}

function preload(){
    ballImage = loadImage('./images/toyStoryBall1.png');
    backgroundImage = loadImage('./images/black-brickwall-better.jpg');
    backgroundImageCopy = loadImage('./images/black-brickwall-better.jpg');
    transparentImage = loadImage('./images/transparent.png')
    gameScreenImage = loadImage('./images/gray.jpg');
}

function setup(){
  rainbowCanvas = createGraphics(resolution.x, resolution.y);
  window.theWholeCanvas = createCanvas(resolution.x, resolution.y);
  brickCanvas = createGraphics(resolution.x, resolution.y);

  rainbowCanvas.show();
  brickCanvas.show();
  rainbowCanvas.style("z-index", "-5");
  brickCanvas.style("z-index", "3");
  rainbowCanvas.style("position", "absolute");
  brickCanvas.style("position", "absolute");

  angleMode(DEGREES);
  textAlign(CENTER);
  textSize(64);

  game = new gameSystem(aspectRatio);
  g = new shortHand(game);
  heightOfGameScreen = game.heightOfGameScreen / game.widthOfGameScreen;

  game.drawRainbowCanvas();
  game.displayGameBackground();

  gameBall = new ball(gameBallRatio, ballStartPosition);

  //Floor moving up, down, left, and right. Contains a beginning and end position. Stays in the game screen
  let startPosition = {x: 0, y: heightOfGameScreen};
  let floorVelocity = {x: 0.005, y: -.001};
  let beginNEndPosition = {begin: 0.2, end: .8};
  let moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
  floors.push(new floor(startPosition, .2, moveVars, function(){
    
    this.moveVertically();

    this.moveHorizontally();

    if(this.startPosition.y < 0 || this.startPosition.y > heightOfGameScreen){
      this.moveVars.floorVelocity.y *= -1;
    }

    if(this.moveVars.floorVelocity.x > 0){
      if(this.startPosition.x + this.length > this.moveVars.beginNEndPosition.end){ // If condition checks using the right edge of line
        this.moveVars.floorVelocity.x *= -1;

        let preBallPosition;
        if(this.ball){
          preBallPosition = this.ball.ballPosition.x - this.startPosition.x;
          //preBallPosition = abs(this.moveVars.beginNEndPosition.end - this.ball.ballPosition.x);
          console.log("previous: " + preBallPosition);
        }
        this.startPosition.x = (this.moveVars.beginNEndPosition.end - ((this.startPosition.x + this.length) - this.moveVars.beginNEndPosition.end)) - this.length;
        if(this.ball){
          //this.ball.ballPosition.x = this.startPosition.x + this.length - preBallPosition;
          this.ball.ballPosition.x = this.startPosition.x + preBallPosition;
          console.log("after: " + (this.ball.ballPosition.x - this.startPosition.x));
        }
      }
    }else if(this.moveVars.floorVelocity.x < 0){
      if(this.startPosition.x < this.moveVars.beginNEndPosition.begin){ // If condition checks using the left edge of line
        this.moveVars.floorVelocity.x *= -1;

        let preBallPosition;
        if(this.ball){
          preBallPosition = this.ball.ballPosition.x - this.startPosition.x;
          //preBallPosition = this.ball.ballPosition.x - this.moveVars.beginNEndPosition.begin;
          console.log("previous: " + preBallPosition);
        }
        this.startPosition.x = this.moveVars.beginNEndPosition.begin + (this.moveVars.beginNEndPosition.begin - this.startPosition.x);
        if(this.ball){
          this.ball.ballPosition.x = this.startPosition.x + preBallPosition;
          console.log("after: " + (this.ball.ballPosition.x - this.startPosition.x));
        }
      }
    }

  }));

  //Floor moving only left and right with a beginning and end position
  startPosition = {x: .2, y: heightOfGameScreen / 2};
  floorVelocity = {x: 0.005, y: 0};
  beginNEndPosition = {begin: 0.2, end: .8};
  moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
  floors.push(new floor(startPosition, .2, moveVars, function(){
    
    this.moveVertically();

    this.moveHorizontally();

    if(this.moveVars.floorVelocity.x > 0){
      if(this.startPosition.x + this.length > this.moveVars.beginNEndPosition.end){ // If condition checks using the right edge of line
        this.moveVars.floorVelocity.x *= -1;
        this.startPosition.x = (this.moveVars.beginNEndPosition.end - ((this.startPosition.x + this.length) - this.moveVars.beginNEndPosition.end)) - this.length;
      }
    }else if(this.moveVars.floorVelocity.x < 0){
      if(this.startPosition.x < this.moveVars.beginNEndPosition.begin){ // If condition checks using the left edge of line
        this.moveVars.floorVelocity.x *= -1;
        this.startPosition.x = this.moveVars.beginNEndPosition.begin + (this.moveVars.beginNEndPosition.begin - this.startPosition.x);
      }
    }
  }));

  //Floor on top left corner to test ball
  startPosition = {x: 0, y: .2};
  floorVelocity = {x: 0, y: 0};
  beginNEndPosition = false;
  moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
  floors.push(new floor(startPosition, .8, moveVars, function(){}));

  
  //Floor on right side that moves only vertically. Is created to test ball
  startPosition = {x: .8, y: heightOfGameScreen};
  floorVelocity = {x: 0, y: -.005};
  beginNEndPosition = {begin: .2, end: heightOfGameScreen};
  moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
  floors.push(new floor(startPosition, .2, moveVars, function(){
    
    this.moveVertically();

    if(this.startPosition.y < this.moveVars.beginNEndPosition.begin || this.startPosition.y > this.moveVars.beginNEndPosition.end){
      this.moveVars.floorVelocity.y *= -1;
    }

  }));
}

draw = function(){
  if (frame == 360){
      frame = 0;
  }
  background(colors.r, colors.g, colors.b);

  game.displayGameScreen();

  for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
    floors[floorIndex].doMovement();
    game.displayFloor(floors[floorIndex]);
  }

  //By putting these two lines before the for loop above, it allows the ball to be in the correct position if floor is moving left and right
  gameBall.doMovement(floors);
  game.displayBall(gameBall);

  frame++;
}