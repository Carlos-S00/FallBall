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
let scrollSpeed = 0;//.0005;
let fallingGameSpeed = .02;

let ballImage;
let ballStartPosition = {x: .3, y: .1};
let gameBallRatio = .05; // Should this be called ballDiameter instead?
let ballAcc = .00015;
let gravity = .0006;
let maxFallSpeed = 1 //.0175;
let maxMoveSpeed = .006;
let ballFric = .97;
let airFric = .99;
let ballFricConst = .00018;
let ballBounce = .009;
let bounceFric = -.0008;
let floorEffectSpeed = 1;

let floors = [];
let numOfFloors = 10;
let holesize = gameBallRatio * 3;
let floorSpeed = .0001;

let walls = [];
let wallHeight = -.04;
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
    this.fall = false;
    this.scrollPos = 0;
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
      y: this.position.startY + this.perToPx(position.y - this.scrollPos)};
    return Coordinate;
  }

  perToPx(percent){
    return percent * this.widthOfGameScreen;
  }

  displayWall(wall){
    let bottomPosition = g.c(wall.bottomPosition);
    let topPosition = {x: wall.bottomPosition.x, y: wall.bottomPosition.y + wall.height}
    topPosition = g.c(topPosition);

    erase();
    line(bottomPosition.x, bottomPosition.y, topPosition.x, topPosition.y);
    noErase();
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
    let tempPosition = {x: ball.ballPosition.x, y: ball.ballPosition.y - .0025};
    if(ball.wallHit.left) tempPosition.x -= .005;
    if(ball.wallHit.right) tempPosition.x += .005;
    let position = g.c(tempPosition);
    let ballDiameter = this.perToPx(ball.ballDiameter);

    translate(position.x, position.y);
    rotate(ball.rotation);
    image(ballImage, -(ballDiameter / 2), -(ballDiameter / 2), ballDiameter, ballDiameter);
    stroke(255,255,0);
    strokeWeight(2);
    noFill();
    if(ball.bounce){
      ellipse(0, 0, ballDiameter+1 + ball.justGotBounce, ballDiameter+1 + ball.justGotBounce);
      if(ball.justGotBounce > 1){
        ball.justGotBounce /= 1.17;
      } else {
        ball.justGotBounce = 0;
      }
    }
    resetMatrix();

    if(position.x - (ballDiameter / 2) < this.position.startX){
      translate(this.position.endX + (position.x -  this.position.startX), position.y);
      rotate(ball.rotation);
      stroke(255,255,0);
      strokeWeight(2);
      noFill();
      if(ball.bounce){
        ellipse(0, 0, ballDiameter+1 + ball.justGotBounce, ballDiameter+1 + ball.justGotBounce);
        if(ball.justGotBounce > 1){
          ball.justGotBounce /= 1.17;
        } else {
          ball.justGotBounce = 0;
        }
      }
      image(ballImage, -(ballDiameter / 2) , -(ballDiameter / 2), ballDiameter, ballDiameter);
      resetMatrix();
    }else if(position.x + (ballDiameter / 2) > this.position.endX){
      translate(this.position.startX - (this.position.endX - position.x), position.y);
      rotate(ball.rotation);
      stroke(255,255,0);
      strokeWeight(2);
      noFill();
      if(ball.bounce){
        ellipse(0, 0, ballDiameter+1 + ball.justGotBounce, ballDiameter+1 + ball.justGotBounce);
        if(ball.justGotBounce > 1){
          ball.justGotBounce /= 1.17;
        } else {
          ball.justGotBounce = 0;
        }
      }
      image(ballImage,  -(ballDiameter / 2) , -(ballDiameter / 2), ballDiameter, ballDiameter);
      resetMatrix();
    }
    
    if(ball.bounceEffect){
      strokeWeight(ball.bounceEffect.duration/15);
      ball.bounceEffect.particles.forEach((particle, ind, arr) => {
        let partPos = g.c(particle.position);
        let partVel = {x: this.perToPx(particle.velocity.x), y: this.perToPx(particle.velocity.y)};
        stroke(particle.color.r, particle.color.g, particle.color.b);
        line(partPos.x, partPos.y, partPos.x + partVel.x, partPos.y + partVel.y);
        arr[ind].position.x += particle.velocity.x;
        arr[ind].position.y += particle.velocity.y;
        arr[ind].velocity.y += 0.00015;
      });
      //let effectPos = g.c(ball.bounceEffect.position);
      //ellipse(effectPos.x, effectPos.y - 20 + ball.bounceEffect.duration, ballDiameter+1 + 20 - ball.bounceEffect.duration, ballDiameter+1 + 20 - ball.bounceEffect.duration * 2);
      ball.bounceEffect.duration -= 1;
      if(ball.bounceEffect.duration == 0){
        ball.bounceEffect = false;
      }
    }
    strokeWeight(1);
  }

  gameFall(ball, floors, walls){
    ball.ballPosition.y += fallingGameSpeed;
    
    for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
      if(floors[floorIndex].moveVars){
        floors[floorIndex].moveVars.floorVelocity.x = 0;
        floors[floorIndex].moveVars.floorVelocity.y = 0;
      }
      floors[floorIndex].startPosition.y += fallingGameSpeed;
    }
    
    for(let wallIndex = 0; wallIndex < walls.length; wallIndex++){
      if(walls[wallIndex].moveVars){
        walls[wallIndex].moveVars.wallVelocity.x = 0;
        walls[wallIndex].moveVars.wallVelocity.y = 0;
      }
      walls[wallIndex].bottomPosition.y += fallingGameSpeed;
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
    this.prevPosition = false;
    this.hasWall = false;
  }
    
  moveVertically(){
    this.startPosition.y += this.moveVars.floorVelocity.y;
  }

  moveHorizontally(){
    if(this.moveVars.floorVelocity.x != 0){
      this.startPosition.x += this.moveVars.floorVelocity.x
    }
  }

  setBallOnFloor(ball){
    this.ball = ball;
    ball.onFloor = this;
    ball.ballVelocity.y = 0;
    ball.ballPosition.y = this.startPosition.y - (ball.ballDiameter / 2);
  }

  checkIfBallHitFloor(ball, nextBallPosition){
    if(nextBallPosition.x >= this.startPosition.x && nextBallPosition.x <= this.startPosition.x + this.length){
      if(ball.onFloor != this){
        if(ball.ballPosition.y  + (ball.ballDiameter / 2) <= this.prevPosition.y && nextBallPosition.y + (ball.ballDiameter / 2) >= this.startPosition.y){
          return true;
        }else{
          return false;
        }
      }else{
        return true;
      }
    }else{
      return false;
    }
  }

  isSlowerFloor(ball, newFloor){
    if(ball.ballPosition.x >= newFloor.startPosition.x && ball.ballPosition.x <= newFloor.startPosition.x + newFloor.length && this != newFloor){
      if(newFloor.prevPosition.y > this.prevPosition.y && newFloor.startPosition.y < this.startPosition.y){
        return true;
      }else{
        return false;
      }
    }else{
      return false;
    }
  }

  doMovement(){
    this.prevPosition = {x: this.startPosition.x, y: this.startPosition.y};
    this.moveFunc();

    /*
    1) NewFloor is moving up relative to the current floor 
    2) Ball is within the X value within the newfloor 
    3) NewFloor crosses the Y value of the current floor Y

    1 & 3) Before position of NewFloor is below Before position of CurrentFloor and After position of NewFloor is above After position of CurrentFloor
    2)

    Make function with these conditions. Call it here. Pass the ball


    Before position of
    After position of
    CurrentFloor
    NewFloor
    is below
    is above
    and
    or
    //*/
  }
}

class wall{
  constructor(bottomPosition, height, moveVars, moveFunc){
    this.bottomPosition = {x: bottomPosition.x, y: bottomPosition.y};
    this.height = height;
    this.moveFunc = moveFunc;
    if(moveVars){
      this.moveVars = moveVars;
    }else{
      this.moveVars = false;
    }
    this.prevPosition = false;
    this.opp = {left: false, right: false};
  }

  moveVertically(){
    this.bottomPosition.y += this.moveVars.wallVelocity.y;
  }

  moveHorizontally(){
    if(this.moveVars.wallVelocity.x != 0){
      this.bottomPosition.x += this.moveVars.wallVelocity.x
    }
  }

  checkIfBallHitWallMovingLeft(prevPosition, ball){
    if(ball.ballPosition.y <= this.bottomPosition.y && ball.ballPosition.y >= this.bottomPosition.y + this.height){
      let prevRightSideOfBall = prevPosition.x + (ball.ballDiameter / 2);
      let currRightSideOfBall =  ball.ballPosition.x + (ball.ballDiameter / 2);
      let wallPrevPosX = this.prevPosition.x;
      let wallCurrPosX = this.bottomPosition.x;
      if(this.opp.left && this.bottomPosition.x - this.prevPosition.x < 0){
        wallCurrPosX = wallPrevPosX + -(this.bottomPosition.x - this.prevPosition.x);
        this.opp.left = false;
      }
      console.log("currRightSideOfBall" + currRightSideOfBall)
      console.log("wallcurrPosX" + wallCurrPosX + 1)
      if((prevRightSideOfBall <= this.prevPosition.x - 1 && currRightSideOfBall >= wallCurrPosX - 1) ||
          (prevRightSideOfBall <= this.prevPosition.x && currRightSideOfBall >= wallCurrPosX && !ball.reflected) ||
          (prevRightSideOfBall <= this.prevPosition.x + 1 && currRightSideOfBall >= wallCurrPosX + 1)){
          if(this.bottomPosition.x - this.prevPosition.x > 0){
            this.opp.left = true;
          }else{
            this.opp.left = false;              
          }
          console.log(prevRightSideOfBall <= this.prevPosition.x - 1 && currRightSideOfBall >= wallCurrPosX - 1)
          console.log(prevRightSideOfBall <= this.prevPosition.x && currRightSideOfBall >= wallCurrPosX && !ball.reflected)
          console.log(prevRightSideOfBall <= this.prevPosition.x + 1 && currRightSideOfBall >= wallCurrPosX + 1)
          return true;
      }else if(ball.onFloor && ball.onFloor.startPosition.x - ball.onFloor.prevPosition.x != 0){
        let floorMovement = ball.onFloor.startPosition.x - ball.onFloor.prevPosition.x;
        let prevRightSideOfBall = prevPosition.x + (ball.ballDiameter / 2) - floorMovement;
        let currRightSideOfBall =  ball.ballPosition.x + (ball.ballDiameter / 2) - floorMovement;
        if((prevRightSideOfBall <= this.prevPosition.x - 1 && currRightSideOfBall >= wallCurrPosX - 1) ||
            (prevRightSideOfBall <= this.prevPosition.x && currRightSideOfBall >= wallCurrPosX && !ball.reflected) ||
            (prevRightSideOfBall <= this.prevPosition.x + 1 && currRightSideOfBall >= wallCurrPosX + 1)){
            if(this.bottomPosition.x - this.prevPosition.x > 0){
              this.opp.left = true;
            }else{
              this.opp.left = false;              
            }
            console.log("2")
            return true;
          }else{
            return false;
          }
      }else{
        return false;
      }
    }
  }
  checkIfBallHitWallMovingRight(prevPosition, ball){
    if(ball.ballPosition.y <= this.bottomPosition.y && ball.ballPosition.y >= this.bottomPosition.y + this.height){
      let prevLeftSideOfBall = prevPosition.x - (ball.ballDiameter / 2);
      let currLeftSideOfBall = ball.ballPosition.x - (ball.ballDiameter / 2);
      let wallPrevPosX = this.prevPosition.x;
      let wallCurrPosX = this.bottomPosition.x;
      if(this.opp.right && this.bottomPosition.x - this.prevPosition.x > 0){
        wallCurrPosX = wallPrevPosX - (this.bottomPosition.x - this.prevPosition.x);
        this.opp.right = false;
        console.log("OPP")
      }
      if((prevLeftSideOfBall  >= this.prevPosition.x - 1 && currLeftSideOfBall  <= wallCurrPosX - 1) ||
         (prevLeftSideOfBall  >= this.prevPosition.x && currLeftSideOfBall  <= wallCurrPosX && !ball.reflected) ||
         (prevLeftSideOfBall  >= this.prevPosition.x + 1 && currLeftSideOfBall  <= wallCurrPosX + 1)){
          console.log("INSIDE")
          if(this.bottomPosition.x - this.prevPosition.x < 0){
            console.log("right is true")
            this.opp.right = true;
          }else{
            console.log("right is false")
            this.opp.right = false;
          }
          return true;
        }else if(ball.onFloor && ball.onFloor.startPosition.x - ball.onFloor.prevPosition.x != 0){
          let floorMovement = ball.onFloor.startPosition.x - ball.onFloor.prevPosition.x;
          let prevLeftSideOfBall = prevPosition.x - (ball.ballDiameter / 2) - floorMovement;
          let currLeftSideOfBall = ball.ballPosition.x - (ball.ballDiameter / 2) - floorMovement;
          if((prevLeftSideOfBall >= this.prevPosition.x - 1 && currLeftSideOfBall <= wallCurrPosX - 1) ||
             (prevLeftSideOfBall >= this.prevPosition.x && currLeftSideOfBall <= wallCurrPosX && !ball.reflected) ||
             (prevLeftSideOfBall >= this.prevPosition.x + 1 && currLeftSideOfBall <= wallCurrPosX + 1)){
              if(this.bottomPosition.x - this.prevPosition.x < 0){
                this.opp.right = true;
              }else{
                this.opp.right = false;
              }
              return true;
            }else{
              return false;
            }
        }else{
          this.opp.right = false;
          return false;
        }
      }
    }

  doMovement(){
    this.prevPosition = {x: this.bottomPosition.x, y: this.bottomPosition.y};
    this.moveFunc();
  }
}

class ball{
  constructor(ballDiameter, ballPosition){
      this.ballDiameter = ballDiameter;
      this.prevPosition = {x: ballPosition.x, y: ballPosition.y};
      this.ballPosition = {x: ballPosition.x, y: ballPosition.y};
      this.ballVelocity = {x: 0, y: 0};
      this.onFloor = false;
      this.rotation = 0;
      this.addFloorVelocity = {x: 0, y: 0};
      this.justGotBounce = 0;
      this.bounce = true;
      this.bounceFric = false;
      this.wallHit = {left: false, right: false};
      this.reflected = false;
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
        this.ballVelocity.x *= airFric;
      }
    }

    return nextXPosition += this.ballVelocity.x;
  }
  
  ifBallOutOfGame(nextXPosition){
    if(nextXPosition < 0){
      nextXPosition += 1;
      this.reflected = true;
    }else if(nextXPosition > 1){
      nextXPosition -= 1;
      this.reflected = true;
    }else{
      this.reflected = false;}
    return nextXPosition;
  }

  moveVertically(nextYPosition){
    if(!this.onFloor){//gravity
      this.ballVelocity.y += gravity;
      this.ballVelocity.y = Math.min(maxFallSpeed, this.ballVelocity.y);
      nextYPosition += this.ballVelocity.y;
    }
    return nextYPosition;
  }

  playBounceEffect(duration, numParticles, strength, position, scale){
    let particles = [];
    for(var i = 0; i < numParticles; i++){
      particles.push({position: {x: position.x, y: position.y}, 
                      velocity: {x: (Math.random() - 0.5) * strength * scale.x, y: Math.random() * strength * scale.y},
                      color: {r: Math.random() * 135 + 120, g: Math.random() * 135 + 120, b: Math.random() * 135 + 120}});
    }
    this.bounceEffect = {particles: particles, duration: duration};
  }

  bounceOnFloor(floor, nextBallPosition){
    let floorVelocity = {x: floor.startPosition.x - floor.prevPosition.x, y: floor.startPosition.y - floor.prevPosition.y};
    let relativeVal = {x: this.ballVelocity.x - floorVelocity.x, y: this.ballVelocity.y - floorVelocity.y};
    let absoluteVal = -relativeVal.y + floorVelocity.y;
    if(relativeVal.y > .009){
      nextBallPosition.y = floor.startPosition.y - (this.ballDiameter / 2);
      this.ballVelocity.y = (absoluteVal) * ((keyIsDown(UP_ARROW) && this.bounce) ? 1.1 : .5);
      if(keyIsDown(UP_ARROW) && this.bounce){
        this.playBounceEffect(60, 20, relativeVal.y, {x: nextBallPosition.x, y: floor.startPosition.y}, {x: 0.5, y: -0.3})
      }
      nextBallPosition.y += this.ballVelocity.y;
      this.ballVelocity.x = floorVelocity.x + (relativeVal.x * .5);
      nextBallPosition.x += this.ballVelocity.x;
      this.bounce = false;
    }else{
      floor.setBallOnFloor(this);
      nextBallPosition.y = this.ballPosition.y;
      this.bounce = true;
      this.justGotBounce = 80;
    }
  }

  doMovement(game, floors){
    let nextBallPosition = {x: this.ballPosition.x, y: this.ballPosition.y};

    nextBallPosition.x = this.moveHorizontally(nextBallPosition.x);
    let totalBallRoll = nextBallPosition.x - this.ballPosition.x;
    nextBallPosition.x = this.ifBallOutOfGame(nextBallPosition.x)

    nextBallPosition.y = this.moveVertically(nextBallPosition.y);

    if(this.onFloor){
      let floorVelocity = {x: this.onFloor.startPosition.x - this.onFloor.prevPosition.x, y: this.onFloor.startPosition.y - this.onFloor.prevPosition.y};
      nextBallPosition.x += floorVelocity.x;
      nextBallPosition.y += floorVelocity.y;

      if(!this.onFloor.checkIfBallHitFloor(this, nextBallPosition)){
        this.ballVelocity.x += floorVelocity.x;
        this.ballVelocity.y += floorVelocity.y;
        this.onFloor.ball = false;
        this.onFloor = false;
      }
    }

    if(!this.onFloor){
      let hitFloors = [];
      for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
        if(floors[floorIndex].checkIfBallHitFloor(this, nextBallPosition)){
          hitFloors.push(floors[floorIndex]);
        }
      }
      if(hitFloors[0]){
        let highestFloor = hitFloors[0];
        for(let floorIndex = 1; floorIndex < hitFloors.length; floorIndex++){
          if(hitFloors[floorIndex].startPosition.y < highestFloor.startPosition.y){
            highestFloor = hitFloors[floorIndex];
          }
        }
        this.bounceOnFloor(highestFloor, nextBallPosition);
      }
    }
    
    this.prevPosition = {x: this.ballPosition.x, y: this.ballPosition.y};
    this.ballPosition.x = nextBallPosition.x;
    this.ballPosition.y = nextBallPosition.y;
    this.wallHit = {left: false, right: false};

    for(let wallIndex = 0; wallIndex < walls.length; wallIndex++){
      if(walls[wallIndex].checkIfBallHitWallMovingLeft(this.prevPosition, this)){
        console.log("left")
        let momentumOfWall = walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x;
        nextBallPosition.x = walls[wallIndex].bottomPosition.x - (this.ballDiameter / 2);
        if(this.wallHit.left && momentumOfWall > 0){
          game.fall = true;
        }
        this.wallHit.left = true;

        if(nextBallPosition.x < 0){
          nextBallPosition.x += 1;
        }

        if(momentumOfWall >= 0){
          //this.ballVelocity.x = momentumOfWall;
          totalBallRoll = momentumOfWall;
        }else{
          if(this.onFloor){// && (this.onFloor.startPosition.x - this.onFloor.prevPosition.x == 0 || this.onFloor.startPosition.x - this.onFloor.prevPosition.x != momentumOfWall)){
            console.log("added left")
            this.ballVelocity.x = momentumOfWall;
            totalBallRoll = momentumOfWall;
          }else{
            totalBallRoll = 0;
          }
        }
      }else if(walls[wallIndex].checkIfBallHitWallMovingRight(this.prevPosition, this)){
        console.log("right")
        let momentumOfWall = walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x;
        nextBallPosition.x = (walls[wallIndex].bottomPosition.x + (this.ballDiameter / 2));
        //console.log("walls[wallIndex].bottomPosition.x: " + walls[wallIndex].bottomPosition.x)
        //console.log("nextBallPosition.x left side : " + (nextBallPosition.x - (this.ballDiameter / 2)))
        if(this.wallHit.right && momentumOfWall < 0){
          game.fall = true;
        }
        this.wallHit.right = true;

        if(nextBallPosition.x > 1){
          nextBallPosition.x -= 1;
        }

        if(momentumOfWall <= 0){
          //this.ballVelocity.x = momentumOfWall
          totalBallRoll = momentumOfWall;
        }else{
          if(this.onFloor){// && (this.onFloor.startPosition.x - this.onFloor.prevPosition.x == 0 || this.onFloor.startPosition.x - this.onFloor.prevPosition.x != momentumOfWall)){
            console.log("added right")
            this.ballVelocity.x = momentumOfWall;
            totalBallRoll = momentumOfWall;
          }else{
            totalBallRoll = 0;
          }
        }
      }
    }

    if(this.wallHit.left && this.wallHit.right){
      game.fall = true;
    }

    this.ballPosition.x = nextBallPosition.x;
    this.ballPosition.y = nextBallPosition.y;
    this.rotation += ((40 * (totalBallRoll)) / (PI * this.ballDiameter)) * 2 * PI;
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

  // Make function a function object to pass in with wall as well. Need to reconstruct allllll objects
  //Floor moving up, down, left, and right. Contains a beginning and end position. Stays in the game screen
  let startPosition = {x: 0, y: heightOfGameScreen};
  let floorVelocity = {x: 0.005, y: -.001};
  let beginNEndPositionX = {begin: 0.2, end: .8};
  let beginNEndPosition = {begin: 0, end: heightOfGameScreen};
  let floorLength = .2;
  let moveVars = {floorVelocity: floorVelocity, beginNEndPositionX: beginNEndPositionX, beginNEndPosition: beginNEndPosition};
  let insideMoveFun = function(){
    this.moveVertically();

    this.moveHorizontally();
    
    if(this.startPosition.y <= this.moveVars.beginNEndPosition.begin || this.startPosition.y >= this.moveVars.beginNEndPosition.end){
      this.moveVars.floorVelocity.y *= -1;
    }

    if(this.moveVars.floorVelocity.x > 0){
      if(this.startPosition.x + this.length > this.moveVars.beginNEndPositionX.end){
        this.moveVars.floorVelocity.x *= -1;
      }
    }else if(this.moveVars.floorVelocity.x < 0){
      if(this.startPosition.x < this.moveVars.beginNEndPositionX.begin){
        this.moveVars.floorVelocity.x *= -1;
      }
    }
  }
  floors.push(new floor(startPosition, floorLength, moveVars, insideMoveFun));
  
  let bottomPosition = {x: 0, y: heightOfGameScreen};
  wallVelocity = {x: 0.005, y: -.001};
  beginNEndPositionX = {begin: 0.2, end: .8};
  beginNEndPosition = {begin: 0, end: heightOfGameScreen};
  moveVars = {wallVelocity: wallVelocity, beginNEndPositionX: beginNEndPositionX, beginNEndPosition: beginNEndPosition};
  let height = wallHeight;
  insideMoveFun = function(){
    this.moveVertically();

    this.moveHorizontally();
    
    if(this.bottomPosition.y <= this.moveVars.beginNEndPosition.begin || this.bottomPosition.y >= this.moveVars.beginNEndPosition.end){
      this.moveVars.wallVelocity.y *= -1;
    }

    if(this.moveVars.wallVelocity.x > 0){
      if(this.bottomPosition.x + floorLength > this.moveVars.beginNEndPositionX.end){
        this.moveVars.wallVelocity.x *= -1;
      }
    }else if(this.moveVars.wallVelocity.x < 0){
      if(this.bottomPosition.x < this.moveVars.beginNEndPositionX.begin){
        this.moveVars.wallVelocity.x *= -1;
      }
    }
  }
  //walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));
  
  bottomPosition = {x: floorLength, y: heightOfGameScreen};
  wallVelocity = {x: 0.005, y: -.001};
  beginNEndPositionX = {begin: floorLength + floorLength, end: .8};
  beginNEndPosition = {begin: 0, end: heightOfGameScreen};
  moveVars = {wallVelocity: wallVelocity, beginNEndPositionX: beginNEndPositionX, beginNEndPosition: beginNEndPosition};
  height = wallHeight;
  insideMoveFun = function(){
    this.moveVertically();

    this.moveHorizontally();
    
    if(this.bottomPosition.y <= this.moveVars.beginNEndPosition.begin || this.bottomPosition.y >= this.moveVars.beginNEndPosition.end){
      this.moveVars.wallVelocity.y *= -1;
    }

    if(this.moveVars.wallVelocity.x > 0){
      if(this.bottomPosition.x > this.moveVars.beginNEndPositionX.end){
        this.moveVars.wallVelocity.x *= -1;
      }
    }else if(this.moveVars.wallVelocity.x < 0){
      if(this.bottomPosition.x < this.moveVars.beginNEndPositionX.begin){
        this.moveVars.wallVelocity.x *= -1;
      }
    }    
  }
 // walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));

  //Floor moving only left and right with a beginning and end position
  startPosition = {x: 0, y: heightOfGameScreen / 2};
  floorVelocity = {x: 0.005, y: 0};
  beginNEndPosition = {begin: 0.2, end: .8};
  moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
  insideMoveFun = function(){
    this.moveHorizontally();

    if(this.moveVars.floorVelocity.x > 0){
      if(this.startPosition.x + this.length > this.moveVars.beginNEndPosition.end){
        this.moveVars.floorVelocity.x *= -1;
        this.startPosition.x = (this.moveVars.beginNEndPosition.end - ((this.startPosition.x + this.length) - this.moveVars.beginNEndPosition.end)) - this.length;
      }
    }else if(this.moveVars.floorVelocity.x < 0){
      if(this.startPosition.x < this.moveVars.beginNEndPosition.begin){
        this.moveVars.floorVelocity.x *= -1;
        this.startPosition.x = this.moveVars.beginNEndPosition.begin + (this.moveVars.beginNEndPosition.begin - this.startPosition.x);
      }
    }
  }
  floors.push(new floor(startPosition, .2, moveVars, insideMoveFun));

  //Floor on top left corner to test ball
  startPosition = {x: -1, y: .2};
  floorVelocity = {x: 0, y: 0}; //.005
  beginNEndPosition = false;
  moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
  insideMoveFun = function(){

    this.moveHorizontally();

    if(this.startPosition.x + 3 >= 2.5 || this.startPosition.x <= -1.5){
      this.moveVars.floorVelocity.x *= -1;
    }
  }
  floors.push(new floor(startPosition, 3, moveVars, insideMoveFun));
  
  bottomPosition = {x: .2, y: .2};
  wallVelocity = {x: 0.005, y: 0};
  beginNEndPosition = {begin: 0, end: 1};
  moveVars = {wallVelocity: wallVelocity, beginNEndPosition: beginNEndPosition};
  height = wallHeight;
  insideMoveFun = function(){

    this.moveHorizontally();

    if(this.moveVars.wallVelocity.x > 0){
      if(this.bottomPosition.x > this.moveVars.beginNEndPosition.end){
        this.moveVars.wallVelocity.x *= -1;
      }
    }else if(this.moveVars.wallVelocity.x < 0){
      if(this.bottomPosition.x < this.moveVars.beginNEndPosition.begin){
        this.moveVars.wallVelocity.x *= -1;
      }
    }
  }
  walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));

  //Floor on right side that moves only vertically. Is created to test ball
  startPosition = {x: .8, y: heightOfGameScreen};
  floorVelocity = {x: 0, y: -.005};
  beginNEndPosition = {begin: 0, end: heightOfGameScreen};
  moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
  insideMoveFun = function(){
    this.moveVertically();

    if(this.startPosition.y <= this.moveVars.beginNEndPosition.begin || this.startPosition.y >= this.moveVars.beginNEndPosition.end){
      this.moveVars.floorVelocity.y *= -1;
    }
  }
  floors.push(new floor(startPosition, .2, moveVars, insideMoveFun));
  
  //Floor on right side that moves only vertically. Is created to test ball
  startPosition = {x: .8, y: .1};
  floorVelocity = {x: 0, y: .005};
  beginNEndPosition = {begin: 0, end: heightOfGameScreen};
  moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
  insideMoveFun = function(){
    this.moveVertically();

    if(this.startPosition.y <= this.moveVars.beginNEndPosition.begin || this.startPosition.y >= this.moveVars.beginNEndPosition.end){
      this.moveVars.floorVelocity.y *= -1;
    }    
  }
  floors.push(new floor(startPosition, .2, moveVars, insideMoveFun));
  
  bottomPosition = {x: 0.2, y: heightOfGameScreen};
  wallVelocity = {x: 0, y: 0};
  beginNEndPosition = {begin: 0, end: 0};
  moveVars = {wallVelocity: wallVelocity, beginNEndPosition: beginNEndPosition};
  height = -heightOfGameScreen + .2;
  insideMoveFun = function(){}
  walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));
}

draw = function(){
  if (frame == 360){
      frame = 0;
  }
  background(colors.r, colors.g, colors.b);

  game.displayGameScreen();

  for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
    floors[floorIndex].doMovement(gameBall);
    game.displayFloor(floors[floorIndex]);
  }

  if(gameBall.onFloor){
    for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
      if(gameBall.onFloor.isSlowerFloor(gameBall, floors[floorIndex])){
        gameBall.onFloor.ball = false;
        floors[floorIndex].setBallOnFloor(gameBall);
        gameBall.ballPosition.y -= floors[floorIndex].startPosition.y - floors[floorIndex].prevPosition.y;
        this.bounce = true;
      }
    }
  }

  for(let wallIndex = 0; wallIndex < walls.length; wallIndex++){
    walls[wallIndex].doMovement();
    game.displayWall(walls[wallIndex]);
  }

  gameBall.doMovement(game, floors);
  game.displayBall(gameBall);

  game.scrollPos += scrollSpeed;

  if((gameBall.ballPosition.y + gameBall.ballDiameter - game.scrollPos <= 0 || mouseIsPressed || gameBall.ballPosition.y - gameBall.ballDiameter - game.scrollPos >= heightOfGameScreen) && game.fall != true){
    game.fall = true;
  }

  if(game.fall){
    game.gameFall(gameBall, floors, walls);

    textSize(32);
    text('Game Over', resolution.x / 2, (resolution.y / 3))
    if(mouseX >= (resolution.x / 2.25 + 5) - (textWidth('Retry') / 2) && mouseX <= (resolution.x / 2.25 + 5) + (textWidth('Retry') / 2) && mouseY >= (resolution.y / 2.25) - 32 && mouseY <= (resolution.y / 2.25)){
      fill(247, 82, 121)
      if(mouseIsPressed){
      }
    }
    text('Retry', resolution.x / 2.25 + 5, (resolution.y / 2.25))
    noFill()
    if(mouseX >= (resolution.x / 1.8 + 5) - (textWidth('Quit') / 2) && mouseX <= (resolution.x / 1.8 + 5) + (textWidth('Quit') / 2) && mouseY >= (resolution.y / 2.25) - 32 && mouseY <= (resolution.y / 2.25)){
      fill(247, 82, 121)
      if(mouseIsPressed){
      }
    }
    text('Quit', resolution.x / 1.8 + 5, (resolution.y / 2.25))
    noFill()
  }

  //delete floors[index];
  //floors.splice(index, 1)

  frame++;
}