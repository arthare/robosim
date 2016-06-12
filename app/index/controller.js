import Ember from 'ember';

const POSITION_COURTYARD = 'Courtyard';
const POSITION_MIDCOURT = 'Neutral Zone';
const POSITION_SECRETPASSAGE = 'Secret Passage';

function _assert(f) {
  if(!f) {
    debugger;
    throw "Assert!";
  }
}

function GameState() {
  this.ballsInCourtYard = 0;
  this.ballsInMidCourt = 6;
  this.passiveDefensesLeft = 4; // how many passive defenses are there left to cross?
  this.activeDefensesLeft = 4;
  this.castleHits = 0;
}
function RobotState() {
  this.position = POSITION_COURTYARD;
  this.haveBall = false;
  this.pointsScored = 0;
  this.defensePoints = 0;
  this.lowPoints = 0;
  this.highPoints = 0;
  
  this._log = [];
  var self = this;
  this.log = function() {
    var str ='';
    str += self.position + ': ';
    
    _.each(arguments, (arg) => {
      if(_.isNumber(arg)) {
        arg = Math.round(arg*10) / 10;
      }
      str += arg;
    });
    self._log.push(str);
  }
}

function rnd(low, high) {
  return (Math.random() * (high-low)) + low;
}

function crossToMidCourt(params, gameState, robotState) {
  _assert(params && gameState && robotState);
  let timeTaken = 0;
  
  if(robotState.position === POSITION_COURTYARD) {
    timeTaken += rnd(params.courtYardToMidCourt_low, params.courtYardToMidCourt_high);
    robotState.position = POSITION_MIDCOURT;
  } else {
    timeTaken += rnd(params.midCourtToSecretPassage_low, params.midCourtToSecretPassage_high);
    robotState.position = POSITION_MIDCOURT;
  }
  
  robotState.log("Took ", timeTaken, "s to cross to neutral zone");
  return timeTaken;
}


function crossToCourtYard(params, gameState, robotState) {
  _assert(params && gameState && robotState);
  let timeTaken = 0;
  
  _assert(robotState.position === POSITION_SECRETPASSAGE || robotState.position === POSITION_MIDCOURT);
  if(robotState.position === POSITION_SECRETPASSAGE) {
    timeTaken += crossToMidCourt(params, gameState, robotState);
  }
  _assert(robotState.position === POSITION_MIDCOURT);
  
  let avgPassive = (params.passiveDefense_low + params.passiveDefense_high) / 2;
  let avgActive = (params.activeDefense_low + params.activeDefense_high) / 2;
  
  let passiveTime = rnd(params.passiveDefense_low, params.passiveDefense_high);
  let activeTime = rnd(params.activeDefense_low, params.activeDefense_low);
  
  // if they get to pick their defense, then what would their time be?
  let freeChoiceTime = avgPassive < avgActive ? passiveTime : activeTime;
  
  _assert(gameState.activeDefensesLeft >= 0 && gameState.passiveDefensesLeft >= 0);
  
  if((gameState.activeDefensesLeft > 0 && gameState.passiveDefensesLeft > 0) ||
     (gameState.activeDefensesLeft === 0 && gameState.passiveDefensesLeft === 0)
  ) {
    // free choice! (since either both are available, or neither are available)
    if(gameState.activeDefensesLeft > 0 && gameState.passiveDefensesLeft > 0) {
      if(avgPassive < avgActive) {
        gameState.passiveDefensesLeft-- 
      } else { 
        gameState.activeDefensesLeft--; 
      }
    }
    
    robotState.pointsScored += 5;
    robotState.defensePoints += 5;
    robotState.position = POSITION_COURTYARD;
    robotState.log("Took ", freeChoiceTime, "s to cross any defense into the courtyard");
    return freeChoiceTime;
  } else if(gameState.activeDefensesLeft > 0) {
    // only active defenses left
    gameState.activeDefensesLeft--;
    robotState.pointsScored += 5;
    robotState.defensePoints += 5;
    robotState.position = POSITION_COURTYARD;
    _assert(gameState.activeDefensesLeft >= 0 && gameState.passiveDefensesLeft >= 0);
    robotState.log("Took ", activeTime, "s to cross a passive defense into the courtyard");
    return activeTime;
  } else if(gameState.passiveDefensesLeft > 0) {
    // only passive defenses left
    gameState.passiveDefensesLeft--;
    robotState.pointsScored += 5;
    robotState.defensePoints += 5;
    robotState.position = POSITION_COURTYARD;
    _assert(gameState.activeDefensesLeft >= 0 && gameState.passiveDefensesLeft >= 0);
    robotState.log("Took ", passiveTime, "s to cross a passive defense into the courtyard");
    return passiveTime;
  } else {
    _assert(false); // should've handled all cases above...
    return 120;
  }
}

function crossToSecretPassage(params, gameState, robotState) {
  _assert(params && gameState && robotState);
  let timeTaken = 0;
  
  if(robotState.position === POSITION_COURTYARD) {
    // gotta cross to midcourt first
    timeTaken = crossToMidCourt(params, gameState, robotState);
  }
  _assert(robotState.position === POSITION_MIDCOURT);
  
  robotState.position = POSITION_SECRETPASSAGE;
  
  const ret = timeTaken + rnd(params.midCourtToSecretPassage_low, params.midCourtToSecretPassage_high);
  robotState.log("Took ", ret, "s to cross to secret passage");
  return ret;
}

function acquireBall(params, gameState, robotState) {
  _assert(params && gameState && robotState);
  
  let timeTaken = 0;
  
  while(!robotState.haveBall) { // as long as we don't have a ball...
  
    switch(robotState.position) {
      case POSITION_COURTYARD:
        if(gameState.ballsInCourtYard > 0) {
          // there's a ball in courtYard, so get it!
          gameState.ballsInCourtYard--;
          robotState.haveBall = true;
          
          const defenderRand = Math.random();
          const hasDefender = defenderRand < params.defenderProbability;
          const defenseFactor = hasDefender ? params.defenseFactor : 1;
          
          timeTaken += defenseFactor * rnd(params.courtYardAcquireBall_low, params.courtYardAcquireBall_high);
          robotState.log("Took ", timeTaken, "s to acquire ball");
          return timeTaken; // ball acquired!
        } else {
          // there's no balls for us here, so we need to head back
          // first, must transition back to midCourt
          timeTaken += crossToMidCourt(params, gameState, robotState);
          
          // just keep looping, the "ball in midCourt" or "Ball in secret passage" cases will be handled below
        }
        break;
      case POSITION_MIDCOURT:
        if(gameState.ballsInCourtYard > 0) {
          // there's a ball in the courtYard, so let's cross a defense and grab it
          timeTaken += crossToCourtYard(params, gameState);
        } else if(gameState.ballsInMidCourt > 0) {
          // there's a ball in midCourt, so let's grab it
          gameState.ballsInMidCourt--;
          robotState.haveBall = true;
          timeTaken += rnd(params.midCourtAcquireBall_low, params.midCourtAcquireBall_high);
          robotState.log("Took ", timeTaken, "s to acquire ball");
          return timeTaken; // ball acquired!
        } else {
          // no balls in courtYard or midCourt, so we gotta go to the secret passage
          timeTaken += crossToSecretPassage(params, gameState, robotState);
        }
        break;
      case POSITION_SECRETPASSAGE:
        // we're in the secret passage.  Let's make the assumption that a ball is always available
        robotState.haveBall = true;
        timeTaken += rnd(params.secretPassageAcquireBall_low, params.secretPassageAcquireBall_high);
        robotState.log("Took ", timeTaken, "s to acquire ball");
        return timeTaken; // ball acquired!
    }
    
  }
}

function performGenericShot(defenseFactor, gameState, robotState, lineup_low, lineup_high, shoot_low, shoot_high, successPct, highPointsEarned, lowPointsEarned) {
  _assert(successPct >= 0 && successPct <= 1.0);
  _assert(highPointsEarned === 0 || lowPointsEarned === 0);
  _assert(highPointsEarned !== 0 || lowPointsEarned !== 0);
  
  let timeTaken = rnd(lineup_low, lineup_high) + rnd(shoot_low, shoot_high);
  timeTaken *= defenseFactor;
  
  const didTheyHit = Math.random() < successPct;
  if(didTheyHit) {
    // good for them!
    robotState.pointsScored += Math.max(highPointsEarned, lowPointsEarned);
    robotState.highPoints += highPointsEarned;
    robotState.lowPoints += lowPointsEarned;
    robotState.haveBall = false;
    robotState.log("Hit shot for ", Math.max(highPointsEarned, lowPointsEarned), "pts");
    gameState.castleHits++;
    return timeTaken;
  } else {
    // miss!
    robotState.haveBall = false;
    gameState.ballsInCourtYard++;
    
    robotState.log("Missed shot");
    return timeTaken;
  }
}
function shootBallInCourtYard(params, gameState, robotState) {
  _assert(params && gameState && robotState);
  
  _assert(robotState.haveBall);
  _assert(robotState.position === POSITION_COURTYARD);
  
  // so the strategy I'm going to go with is:
  // 1) check if there's a defender (which is basically a dice roll)
  // 2) adjust lowgoal and highgoal times by the defense factor
  // 3) pick the one with the lower expected time (since the drivers won't be PLANNING on missing, we won't factor in the expected effectiveness)
  
  const defenderRand = Math.random();
  const hasDefender = defenderRand < params.defenderProbability;
  const defenseFactor = hasDefender ? params.defenseFactor : 1;
  
  const highLineup = defenseFactor * (params.highGoalLineup_low + params.highGoalLineup_high) / 2;
  const highShoot = (params.highGoalShoot_low + params.highGoalShoot_high) / 2;
  const highExpectedTime = highLineup + highShoot;
  
  const lowLineup = defenseFactor * (params.lowGoalLineup_low + params.lowGoalLineup_high) / 2;
  const lowShoot = (params.lowGoalShoot_low + params.lowGoalShoot_high) / 2;
  const lowExpectedTime = lowShoot + lowLineup;
  
  if(params.highGoalShootPct > 0 && highExpectedTime < lowExpectedTime) {
    // this robot's drivers will tend to shoot high because they think their robot is better at it
    const timeTaken = performGenericShot(defenseFactor, gameState, robotState, params.highGoalLineup_low, params.highGoalLineup_high, params.highGoalShoot_low, params.highGoalShoot_high, params.highGoalShootPct, 5, 0);
    robotState.log("Took ", timeTaken, "s to line up and shoot high");
    return timeTaken;
  } else {
    // and these robot's drivers will tend to shoot low
    const timeTaken = performGenericShot(defenseFactor, gameState, robotState, params.lowGoalLineup_low, params.lowGoalLineup_high, params.lowGoalShoot_low, params.lowGoalShoot_high, params.lowGoalShootPct, 0, 2);
    robotState.log("Took ", timeTaken, "s to line up and shoot low");
    return timeTaken;
  }
}

function shootBall(params, gameState, robotState) {
  _assert(params && gameState && robotState);
  
  let timeTaken = 0;
  
  while(true) { // we return from the middle when we're done shooting
  
    switch(robotState.position) {
      case POSITION_COURTYARD:
        timeTaken += shootBallInCourtYard(params, gameState, robotState);
        return timeTaken;
      case POSITION_MIDCOURT:
        // get thee to the courtyard!
        timeTaken += crossToCourtYard(params, gameState, robotState);
        _assert(robotState.position === POSITION_COURTYARD);
        break;
      case POSITION_SECRETPASSAGE:
        timeTaken += crossToCourtYard(params, gameState, robotState);
        _assert(robotState.position === POSITION_COURTYARD);
        break;
      default:
        _assert(false);
        break;
    }
  }
}


export default Ember.Controller.extend({
  
  
  // how much harder does the presence of defense make lining up and corraling balls?
  params: {
    defenderProbability: 0.5, // fraction of the time (0-1) that a courtyard defender is present
    defenseFactor: 2,  // how much harder does a defender make your scoring job (lineups and shoots)?
    
    passiveDefense_low: 1,
    passiveDefense_high: 20,
    
    activeDefense_low: 3,
    activeDefense_high: 30,
    
    courtYardToMidCourt_low: 1,
    courtYardToMidCourt_high: 5,
    
    midCourtToSecretPassage_low: 1,
    midCourtToSecretPassage_high: 5,
    
    
    
    lowGoalLineup_low: 1,
    lowGoalLineup_high: 5,
    lowGoalShoot_low: 1,
    lowGoalShoot_high: 2,
    
    highGoalLineup_low: 1,
    highGoalLineup_high: 2,
    highGoalShoot_low: 1,
    highGoalShoot_high: 3,
    
    highGoalShootPct: 0.7,
    lowGoalShootPct: 0.95,
    
    // getting balls
    courtYardAcquireBall_low: 5,
    courtYardAcquireBall_high: 30, 
    
    midCourtAcquireBall_low: 5,
    midCourtAcquireBall_high: 30,
    
    secretPassageAcquireBall_low: 2,
    secretPassageAcquireBall_high: 5, 
  },
  
  getValue: Ember.computed(function() {
    console.log("arguments");
  }),
  
  vars: Ember.computed('params', function() {
    return Object.keys(this.get('params'));
  }),
  
  _simulateRound: function(params, totals, dumpRobotLog) {
    _assert(params);
    _assert(_.isObject(totals) && 
            !_.isUndefined(totals.rps) && 
            !_.isUndefined(totals.pts) &&
            !_.isUndefined(totals.lowPoints) &&
            !_.isUndefined(totals.highPoints));
            
    let time = 0;
    
    let gameState = new GameState();
    let robotState = new RobotState();
    
    while(time < 135) {
      
      if(!robotState.haveBall) {
        // we need a ball
        const timeToGetBall = acquireBall(params, gameState, robotState);
        _assert(robotState.haveBall);
        time += timeToGetBall;
      } else {
        // we have a ball!
        const timeToShootBall = shootBall(params, gameState, robotState);
        _assert(!robotState.haveBall);
        
        time += timeToShootBall;
      }
    }
    
    // record the simulation totals
    totals.pts += robotState.pointsScored;
    totals.defensePoints += robotState.defensePoints;
    totals.lowPoints += robotState.lowPoints;
    totals.highPoints += robotState.highPoints;
    totals.castleHits += gameState.castleHits;
    totals.activeDefenses += (4-gameState.activeDefensesLeft);
    totals.passiveDefenses += (4-gameState.passiveDefensesLeft);
    if(gameState.activeDefensesLeft <= 0 && gameState.passiveDefensesLeft <= 0) {
      // they got the RP for breaking defenses
      totals.rps++;
    }
    if(gameState.castleHits >= 8) {
      // they got the RP for breaking the castle
      totals.rps++;
    }
    
    if(dumpRobotLog) {
      console.log(robotState._log);
      this.set('sampleLog', robotState._log.join('<br>'));
    }
  },
  _doCalculate: function(params) {
    
    for(var key in params) {
      params[key] = parseFloat(params[key]);
      _assert(_.isNumber(params[key]));
    }
    
    var totals = {
      rps: 0,
      pts: 0,
      defensePoints: 0,
      lowPoints: 0,
      highPoints: 0,
      castleHits: 0,
      activeDefenses: 0,
      passiveDefenses: 0,
    };
    const c = 2500;
  
    for(var x = 0;x < c; x++) {
      this._simulateRound(params, totals, x===c-1);
    }
    
    for(var key in totals) {
      totals[key] = totals[key] / c;
    }
    this.set('lastTotal', totals);
  },
  
  init: function() {
    this.set('defaults', _.clone(this.get('params'), true));
  },
  
  
  actions: {
    calculate: function() {
      this._doCalculate(this.get('params'));
    },
    calculate_no_high: function() {
      var paramCopy = _.clone(this.get('params'), true);
      paramCopy.highGoalShootPct = -1;
      this._doCalculate(paramCopy);
    },
    reset: function() {
      console.log("setting from defaults: ", this.get('defaults'));
      this.set('params', this.get('defaults'));
    }
  }
});
