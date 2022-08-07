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

let ballImage;
let ballStartPosition = {x: .025, y: .05};
let gameBallRatio = .05;
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

let test = function(){

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

  displayGameScreen(){
    //image(backgroundImage, 0, 0, backgroundImage.x, backgroundImage.y)
    this.recalcScreen()
    image(gameScreenImage, this.position.startX, this.position.startY, this.widthOfGameScreen, this.heightOfGameScreen)
  }

  resetImage(images){
    return images.copy(backgroundImageCopy, 0, 0, backgroundImageCopy.width, backgroundImageCopy.height, 0, 0, backgroundImageCopy.width, backgroundImageCopy.height);
  }
  
  displayGameBackground(){
    let currentWidth = 140;
    let currentHeight = 0;

    /* it works the other way
    if(140 >= this.position.startX){
      //image(backgroundImage, 0, currentHeight, this.position.startX - currentWidth + 5, 100, 65, 78, 130, 137);
      while(currentHeight <= this.position.endY){
        image(backgroundImage, 0, currentHeight, this.position.startX, 100, 58, 78, this.position.startX, 137);
        currentHeight += 100 - 5;
      }
    }else{
      while(currentHeight <= this.position.endY){
        image(backgroundImage, 0, currentHeight, 140, 100, 58, 78, 140, 137);
        let off = 1;
        while(currentWidth + 140 < this.position.startX){
          image(backgroundImage, currentWidth, currentHeight, 140, 100, 58, 78, 140, 137);
          currentWidth += 140;
          off++;
        }
        if(currentWidth < this.position.startX){
          image(backgroundImage, currentWidth, currentHeight, this.position.startX - currentWidth, 100, 58, 78, this.position.startX - (140 * off), 137);
        }
        currentWidth = 140;
        currentHeight += 100 - 5;
      }
    }
    //image(backgroundImage, this.position.endX, 0, resolution.x - this.position.endX, this.position.endY, 0, 0, this.position.startX, this.position.endY)
    //*/
    
      while(currentHeight <= this.position.endY){
        image(backgroundImage, this.position.startX - currentWidth, currentHeight, 140, 100, 58, 78, 140, 137);
        currentWidth += 140;

        while(this.position.startX - currentWidth > -140){
          image(backgroundImage, this.position.startX - currentWidth, currentHeight, 140, 100, 58, 78, 140, 137);
          currentWidth += 140;
        }
        currentWidth = 140;
        currentHeight += 100 - 5;
      }

      currentHeight = 0;

      currentWidth = this.position.endX;
      while(currentHeight <= this.position.endY){
        image(backgroundImage, currentWidth, currentHeight, 140, 100, 58, 78, 140, 137);
        
        while(currentWidth < resolution.x ){
          image(backgroundImage, currentWidth + 140, currentHeight, 140, 100, 58, 78, 140, 137);
          currentWidth += 140;
        }
        currentWidth = this.position.endX;
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
  
  LineColor(colorNum){
    colorNum = colorNum % 1529;
    if(colorNum <= 255){ //0 - 255
        stroke(255, colorNum, 0);
      }else if(colorNum <= 510){ // 256 - 510
        stroke(510 - colorNum, 255, 0);
      }else if (colorNum <= 765){ // 511 - 765
        stroke(0, 255, colorNum - 510);
      }else if(colorNum <= 1020){ //766 - 1020
        stroke(0, 1020 - colorNum, 255);
      }else if(colorNum <= 1275){ // 1021 - 1275
        stroke(colorNum - 1020, 0, 255);
      }else if(colorNum <= 1529){ //1276 - 1529
        stroke(255, 0, 1529 - colorNum);
      }else{
        stroke(255, colorNum, 0);
      }
      colorNum += 5;
      return colorNum;
    }
  
    //floors[floorIndex].displayFloor(game.c(floors[floorIndex].StartPosition), game.c(floors[floorIndex].EndPosition));
    //walls[wallIndex].displayWall(game.c(walls[wallIndex].StartPosition), game.c(walls[wallIndex].EndPosition));
    //gameBall.displayBall(game.c(gameBall.BallPosition), (gameBallRatio * game.widthOfGameScreen));

  displayWall(wall){
    wall.colorNum = this.LineColor(wall.colorNum);
    let startPosition = g.c(wall.topPosition);
    let endPosition = g.c(wall.bottomPosition);

    line(startPosition.x, startPosition.y, endPosition.x, endPosition.y);
  }
  
  displayFloor(floor){
    floor.colorNum = this.LineColor(floor.colorNum);
    let startPosition = g.c(floor.StartPosition);
    let endPosition = g.c(floor.EndPosition);

    line(startPosition.x, startPosition.y, endPosition.x, endPosition.y);
  }

  displayBall(ball){
    let position = g.c(ball.BallPosition);
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

  createFloorsNWalls(placeFloors = true, placeWalls = true){

    let floorindex = 0;
    let wallIndex = 0;

    for(let floorNum = 0; floorNum < numOfFloors; floorNum++){
      let colorNum = {one: (floorindex + 1) * 20, two: (floorindex + 2) * 20, three: (floorindex + 3) * 20};
      let begHole = random(1 - holesize);
      let begWall = begHole;
  
      while(
        (begWall >= begHole && begWall <= begHole + holesize) || 
        (begWall + holesize >= begHole && begWall + holesize <= begHole + holesize) || 
        begWall + holesize > 1){
        begWall = random()
      }
  
      let floorStartPosition = {x: 0, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1)};
      let floorEndPosition = {x: begHole, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1)};
      
      if(placeFloors){
        floors[floorindex++] = new floor(floorStartPosition, floorEndPosition, colorNum.one);
        
        floorStartPosition = {x: begHole + holesize, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1)};
        floorEndPosition = {x: 1, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1)};
        floors[floorindex++] = new floor(floorStartPosition, floorEndPosition, colorNum.two);
      }

      let wallStartPosition = {x: begWall, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1)};
      let wallEndPosition = {x: begWall, y: (((1 / aspectRatio) / numOfFloors) * (floorNum + 1)) - wallHeight};

      if(placeWalls){
        walls[wallIndex++] = new wall(wallStartPosition, wallEndPosition, colorNum.three);

        floorStartPosition = {x: begWall, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1) - wallHeight};
        floorEndPosition = {x: begWall + wallwidth, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1) - wallHeight};

        floors[floorindex++] = new floor(floorStartPosition, floorEndPosition, colorNum.three);

        wallStartPosition = {x: begWall + wallwidth, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1)};
        wallEndPosition = {x: begWall + wallwidth, y: (((1 / aspectRatio) / numOfFloors) * (floorNum + 1)) - wallHeight};

        walls[wallIndex++] = new wall(wallStartPosition, wallEndPosition, colorNum.three);
      }
    }
  }

  createFloors(){
    
  }

  createWalls(){

  }
}

class floor{
  constructor(StartPosition, EndPosition, colorNum, move, floorVelocity, moveFunc){
    this.StartPosition = {x: StartPosition.x, y: StartPosition.y};
    this.EndPosition = {x: EndPosition.x, y: EndPosition.y};
    this.colorNum = colorNum;
    this.ball = false;
    this.moveFunc = moveFunc;
    if(move){
      this.move = {startBegX: move.startBegX, startEndX: move.startEndX, endStartX: move.endStartX, endEndX: move.endEndX};
    }else{
      this.move = false;
    }
    this.floorVelocity = {x: floorVelocity.x, y: floorVelocity.y};
    this.diff = 0;
  }

  moveVertically(){
    this.StartPosition.y += this.floorVelocity.y;
    this.EndPosition.y += this.floorVelocity.y;
  }

  moveHorizontally(){
    if(this.move){
      if(this.ball){
        this.diff = this.StartPosition.x;
      }

      if(this.floorVelocity.x < 0){
        this.StartPosition.x += this.floorVelocity.x;
        this.EndPosition.x +=this.floorVelocity.x;

        if(this.StartPosition.x <= this.move.startBegX){
          this.StartPosition.x = this.move.startBegX;
          this.EndPosition.x = this.move.startEndX;
          this.floorVelocity.x *= -1;
        }
        
      }else{
        this.StartPosition.x += this.floorVelocity.x;
        this.EndPosition.x +=this.floorVelocity.x; 

        if(this.EndPosition.x >= this.move.endEndX){
          this.StartPosition.x = this.move.endStartX;
          this.EndPosition.x = this.move.endEndX;
          this.floorVelocity.x *= -1;
        }
      }
    }
  }

  ifBallOnFloor(){
    if(this.ball){
      if(this.move){
        this.ball.BallPosition.x += this.StartPosition.x - this.diff;
      }
      this.ball.BallPosition.y = this.StartPosition.y - (this.ball.ballDiameter / 2) - .0025;
    }
  }

  doMovement(){
    this.moveFunc();
  }
}

class ball{
  constructor(ballDiameter, BallPosition){
      this.ballDiameter = ballDiameter;
      this.BallPosition = {x: BallPosition.x, y: BallPosition.y};
      this.ballVelocity = {x: 0, y: 0};
      this.onFloor = false;
      this.rotation = 0;
      this.addFloorVelocity = {x: 0, y: 0};
  }

  moveHorizontally(){
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
      }else{
        //Less friction
          this.ballVelocity.x *= ballFric;
      }
    }
  }

  moveVertically(){
    if(!this.onFloor){//gravity
      this.ballVelocity.y += gravity;
      this.ballVelocity.y = Math.min(maxFallSpeed, this.ballVelocity.y);
    }
  }

  newBallPosition(nextBallPosition){
    this.BallPosition.x += this.ballVelocity.x;
    this.rotation += ((40 * (this.ballVelocity.x)) / (PI * this.ballDiameter)) * 2 * PI;

    nextBallPosition.y += this.ballVelocity.y + this.addFloorVelocity.y;
  }

  ifBallOnFloor(){
    if(this.onFloor){
      if(this.BallPosition.x > this.onFloor.EndPosition.x || this.BallPosition.x < this.onFloor.StartPosition.x){
        
        this.addFloorVelocity = {x: this.onFloor.floorVelocity.x, y: this.onFloor.floorVelocity.y};
        this.ballVelocity.x += this.addFloorVelocity.x;
        this.rotation += (40 * this.ballVelocity.x / (PI * this.ballDiameter)) * 2 * PI;
        this.BallPosition.x += this.ballVelocity.x;
        
        //Maybe this needs to be something else? -^

        for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
          floors[floorIndex].ball = false;
        }
        this.onFloor = false;
      }
    }
  }

  ifBallNoLongerOnFloor(nextBallPosition){
    if(!this.onFloor){
        for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
          if((nextBallPosition.y + (this.ballDiameter / 2) > floors[floorIndex].StartPosition.y &&
            this.BallPosition.y + (this.ballDiameter / 2) < floors[floorIndex].StartPosition.y  &&
            nextBallPosition.x >= floors[floorIndex].StartPosition.x && 
            nextBallPosition.x <= floors[floorIndex].EndPosition.x) ||
            (abs(floors[floorIndex].floorVelocity.y) + floors[floorIndex].StartPosition.y >= this.BallPosition.y + (this.ballDiameter / 2) &&
            floors[floorIndex].StartPosition.y <= this.BallPosition.y + (this.ballDiameter / 2) &&
            nextBallPosition.x > floors[floorIndex].StartPosition.x &&
            nextBallPosition.x < floors[floorIndex].EndPosition.x)){

              if(this.ballVelocity.y < maxFallSpeed * (3/5)){
                this.ballVelocity.y = 0;
                this.BallPosition.y =  floors[floorIndex].StartPosition.y - (this.ballDiameter / 2) - .0025;
                this.onFloor = floors[floorIndex];
                floors[floorIndex].ball = this;
                //this.ballVelocity.x += this.addFloorVelocity.x
                this.addFloorVelocity = {x: 0, y: 0};

                
                if(this.ballVelocity.x < 0){
                  this.ballVelocity.x = Math.max(-maxMoveSpeed, this.ballVelocity.x);
                } else if(this.ballVelocity.x > 0){
                  this.ballVelocity.x = Math.min(maxMoveSpeed, this.ballVelocity.x);
                }


              }else{
                this.ballVelocity.y = -ballBounce * (keyIsDown(UP_ARROW) ? 1.45 : 1);

                //this.addFloorVelocity = {x: 0, y: 0};
              }
              break;
          }else{
            this.onFloor = false;
            floors[floorIndex].ball = false;

          }
      }
    }
  }

  ifBallOutOfGame(){
    if(this.BallPosition.x < 0){
      this.BallPosition.x += 1;
    }else if(this.BallPosition.x > 1){
      this.BallPosition.x -= 1;
    }
  }

  doMovement(floors, walls){

    let nextBallPosition = {x: this.BallPosition.x, y: this.BallPosition.y};

    this.moveHorizontally();
    
    this.moveVertically();

    this.newBallPosition(nextBallPosition);
    
    this.ifBallOutOfGame();

    this.ifBallOnFloor();

    this.ifBallNoLongerOnFloor(nextBallPosition);

    this.BallPosition.y += this.ballVelocity.y;


  }
}

class wall{
  constructor(topPosition, bottomPosition, colorNum, wallVelocity, onFloor, moveFunc){
    this.topPosition = {x: topPosition.x, y: topPosition.y};
    this.bottomPosition = {x: bottomPosition.x, y: bottomPosition.y};
    this.colorNum = colorNum;
    this.ball = false // Maybe doesn't need to know it?
    this.moveFunc = moveFunc;
    //this.wallVelocity = {x: wallVelocity.x, y: wallVelocity.y}; // Will use floor velocity instead?
    this.onFloor = onFloor;
  }

  moveVertically(){    
    this.topPosition.y += this.onFloor.floorVelocity.y;
    this.bottomPosition.y += this.onFloor.floorVelocity.y;
  }

  moveHorizontally(){
    console.log(this.onFloor.floorVelocity.x)
    //console.log("Before: " + this.topPosition.x)
    //console.log(this.onFloor.move)
    if(this.onFloor.move){
      if(this.onFloor.floorVelocity.x < 0){
        this.topPosition.x -= this.onFloor.floorVelocity.x;
        this.bottomPosition.x -= this.onFloor.floorVelocity.x;
      }else if(this.onFloor.floorVelocity.x > 0){
        this.topPosition.x += this.onFloor.floorVelocity.x;
        this.bottomPosition.x += this.onFloor.floorVelocity.x; 
      }
      //console.log("After: " + this.topPosition.x)
    }
  }
  /*
  ifBallOnFloor(){
    if(this.ball){
      if(this.move){
        this.ball.BallPosition.x = this.topPosition.x + this.diff;
      }
      this.ball.BallPosition.y = this.topPosition.y - (this.ball.ballDiameter / 2) - .0025;
      this.ball.bounce = false;
    }
  }
  //*/
  doMovement(){
    this.moveFunc();
  }
}

class shortHand{
  constructor(game){
    this.g = game;
  }

  c(position){
    return this.g.coordToScreen(position);
  }

  r(images){
    return this.g.resetImage(images);
  }
}

function setup(){
  window.theWholeCanvas = createCanvas(resolution.x, resolution.y);

  angleMode(DEGREES);
  textAlign(CENTER);
  textSize(64);

  ballImage = loadImage('./images/toyStoryBall1.png');
  backgroundImage = loadImage('./images/black-brickwall-better.jpg');
  backgroundImageCopy = loadImage('./images/black-brickwall-better.jpg');
  transparentImage = loadImage('./images/transparent.png')

  gameScreenImage = loadImage('./images/gray.jpg');

  game = new gameSystem(aspectRatio);
  g = new shortHand(game);

  let BallPosition = {x: ballStartPosition.x, y: ballStartPosition.y};
  gameBall = new ball(gameBallRatio, BallPosition);

  let floorindex = 0;
  let wallIndex = 0;

  //
  // First floor
  //
  
  //game.createFloorsNWalls(true, true);
  // game.heightOfGameScreen / game.widthOfGameScreen
  let floorStartPosition = {x: 0, y: game.heightOfGameScreen / game.widthOfGameScreen};
  let floorEndPosition = {x: 1, y: game.heightOfGameScreen / game.widthOfGameScreen};
  let floorVelocity = {x: .001, y: -.001}; // -.001 y
  let move = {startBegX: floorStartPosition.x, startEndX: floorEndPosition.x, endStartX: 1 - (floorEndPosition.x - floorStartPosition.x), endEndX: 1};
  move = false;
  floors[floorindex++] = new floor(floorStartPosition, floorEndPosition, 800, move, floorVelocity,  function(){
    this.diff = 0;

    this.moveVertically();

    this.moveHorizontally();
    
    this.ifBallOnFloor();
    
  });

  //
  // Second floor
  //
  
  floorStartPosition = {x: .40, y: game.heightOfGameScreen / game.widthOfGameScreen};
  floorEndPosition = {x: .80, y: game.heightOfGameScreen / game.widthOfGameScreen};
  floorVelocity = {x: .005, y: -0.002}; // y: -.001
  move = {startBegX: 0, startEndX: floorEndPosition.x - floorStartPosition.x, endStartX: 1 - (floorEndPosition.x - floorStartPosition.x), endEndX: 1};
  //move = {startBegX: 0, startEndX: .4, endStartX: .6, endEndX: 1, back: false, speed: .005};

  floors.push(new floor(floorStartPosition, floorEndPosition, 800, move, floorVelocity,  function(){
    this.diff = 0;
    
    this.moveVertically();

    this.moveHorizontally();

    this.ifBallOnFloor();
    
  }));

  //
  //Creates wall to Second floor
  //

  let onFloor = floors[1];
  let topPosition = {x: onFloor.StartPosition.x + .15, y: onFloor.StartPosition.y - wallHeight};
  let bottomPosition = {x: onFloor.StartPosition.x + .15, y: onFloor.StartPosition.y};
  let colorNum = 800;
  let wallVelocity = {x: .005, y: 0};

  walls[wallIndex++] = new wall(topPosition, bottomPosition, colorNum, wallVelocity, onFloor, function(){
    
    this.moveVertically();

    this.moveHorizontally();

  });

}

draw = function(){

  if (frame == 360){
    frame = 0;
  }
  background(colors.r, colors.g, colors.b);

  game.displayGameScreen();

  for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
    floors[floorIndex].doMovement();
    game.displayFloor(floors[floorIndex])
    //floors[floorIndex].displayFloor(game.c(floors[floorIndex].StartPosition), game.c(floors[floorIndex].EndPosition));
  }
  
  for(let wallIndex = 0; wallIndex < walls.length; wallIndex++){
    walls[wallIndex].doMovement();
    game.displayWall(walls[wallIndex])
    //walls[wallIndex].displayWall(game.c(walls[wallIndex].StartPosition), game.c(walls[wallIndex].EndPosition));
  }



  gameBall.doMovement(floors, walls);

  game.displayBall(gameBall);
  //gameBall.displayBall(game.c(gameBall.BallPosition), (gameBallRatio * game.widthOfGameScreen));
  game.displayGameBackground();

  frame++;
}

// creating the game system ( window and how to handle position and size)
// creating the game objects (ball floor wall and their interactions)
// building the game out of the objects
