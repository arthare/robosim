import Ember from 'ember';

export default Ember.Component.extend({
  name: null, // input, mandatory - the variable name they want us to modify/display
  data: null, // the actual data object that we're trying to read from
  
  value: Ember.computed('data', {
    get: function() {
      let ret = this.get('data.' + this.get('name'));
      return ret;
    },
    set: function(key, value) {
      this.set('data.' + this.get('name'), parseFloat(value));
      return value;
    }
  }),
  
  description: Ember.computed('name', function() {
    switch(this.get('name')) {
      case 'defenderProbability': return {step:0.05, min: 0, max: 1, desc: "Fraction of the time (0-1) that a courtyard defender is present"};
      case 'defenseFactor': return {step:0.5, min: 1, max: 10, desc: "How much harder (multiple) lining up is with a defender present"};
      
      case 'passiveDefense_low': return {step: 0.5, min: 1, max: 60, desc: "Best-case crossing-time (seconds) for neutral->courtyard over a passive defense"};
      case 'passiveDefense_high': return {step: 0.5, min: 1, max: 60, desc: "Worst-case crossing-time (seconds) for neutral->courtyard over a passive defense"};
      
      case 'courtYardToMidCourt_low': return {step: 0.5, min: 1, max: 60, desc: "Best-case crossing-time (seconds) going courtyard->neutral"};
      case 'courtYardToMidCourt_high': return {step: 0.5, min: 1, max: 60, desc: "Worst-case crossing-time (seconds) going courtyard->neutral"};
      
      case 'midCourtToSecretPassage_low': return {step: 0.5, min: 1, max: 60, desc: "Best-case crossing-time (seconds) going neutral->your secret passage"};
      case 'midCourtToSecretPassage_high': return {step: 0.5, min: 1, max: 60, desc: "Worst-case crossing-time (seconds) going neutral->your secret passage"};
      
      case 'activeDefense_low': return {step: 0.5, min: 1, max: 60, desc: "Best-case crossing-time (seconds) going forwards through an active defense"};
      case 'activeDefense_high': return {step: 0.5, min: 1, max: 60, desc: "Worst-case crossing-time (seconds) going forwards through an active defense"};
      
      
      case 'lowGoalLineup_low': return {step: 0.5, min: 1, max: 60, desc: "Best-case time (seconds) to line up for a low goal from anywhere on the courtyard [defense-affected]"};
      case 'lowGoalLineup_high': return {step: 0.5, min: 1, max: 60, desc: "Worst-case time (seconds) to line up for a low goal from anywhere on the courtyard [defense-affected]"};
      case 'lowGoalShoot_low': return {step: 0.5, min: 1, max: 60, desc: "Best-case time (seconds) attempt a low-goal shot"};
      case 'lowGoalShoot_high': return {step: 0.5, min: 1, max: 60, desc: "Worst-case time (seconds) attempt a low-goal shot"};
      
      case 'highGoalLineup_low': return {step: 0.5, min: 1, max: 60, desc: "Best-case time (seconds) to line up for a high goal from anywhere on the courtyard [defense-affected]"};
      case 'highGoalLineup_high': return {step: 0.5, min: 1, max: 60, desc: "Worst-case time (seconds) to line up for a high goal from anywhere on the courtyard [defense-affected]"};
      case 'highGoalShoot_low': return {step: 0.5, min: 1, max: 60, desc: "Best-case time (seconds) attempt a high-goal shot"};
      case 'highGoalShoot_high': return {step: 0.5, min: 1, max: 60, desc: "Worst-case time (seconds) attempt a high-goal shot"};
      
      case 'highGoalShootPct': return {step:0.05, min: 0, max: 1, desc: "Fraction (0-1) of high-goal shots that go in"};
      case 'lowGoalShootPct': return {step:0.05, min: 0, max: 1, desc: "Fraction (0-1) of low-goal shots that go in"};
      
      // getting balls
      case 'courtYardAcquireBall_low': return {step: 0.5, min: 1, max: 60, desc: "Best-case time (seconds) to corral and acquire a ball in the courtyard [defense-affected]"};
      case 'courtYardAcquireBall_high': return {step: 0.5, min: 1, max: 60, desc: "Worst-case time (seconds) to corral and acquire a ball in the courtyard [defense-affected]"};
      
      case 'midCourtAcquireBall_low': return {step: 0.5, min: 1, max: 60, desc: "Best-case time (seconds) to corral and acquire a ball in the neutral zone"};
      case 'midCourtAcquireBall_high': return {step: 0.5, min: 1, max: 60, desc: "Worst-case time (seconds) to corral and acquire a ball in the neutral zone"};
      
      case 'secretPassageAcquireBall_low': return {step: 0.5, min: 1, max: 60, desc: "Best-case time (seconds) to corral and acquire a ball in your secret passage"};
      case 'secretPassageAcquireBall_high': return {step: 0.5, min: 1, max: 60, desc: "Worst-case time (seconds) to corral and acquire a ball in your secret passage"};
      
      default:
        debugger;
        return 'Unknown';
    }
  })
});
