/*!
 *  This script is demonstrating the new CasperJS Navigation Step Flow Control
 *  by adding new functions label() and goto().
 *
 *  As a sample, this 'do_while.js' is to display 1 to 10 by loop like  do{...}while(...)
 *  with Dump Navigation Steps by dumpSteps() function.
 */

//================================================================================

var casper = require('casper').create({
//    verbose: true,          // true or false
//    logLevel: 'debug',      // 'debug' 'info' 'warning' 'error'
});

//================================================================================
//================================================================================
// Extending Casper functions for realizing label() and goto()
// 
// Functions:
//   checkStep()   Revised original checkStep()
//   then()        Revised original then()
//   label()       New function for making empty new navigation step and affixing the new label on it.
//   goto()        New function for jumping to the labeled navigation step that is affixed by label()
//   dumpSteps()   New function for Dump Navigation Steps. This is very helpful as a flow control debugging tool.
// 

var utils = require('utils');
var f = utils.format;

/**
 * Revised checkStep() function for realizing label() and goto()
 * Every revised points are commented.
 *
 * @param  Casper    self        A self reference
 * @param  function  onComplete  An options callback to apply on completion
 */
casper.checkStep = function checkStep(self, onComplete) {
    if (self.pendingWait || self.loadInProgress) {
        return;
    }
    self.current = self.step;                 // Added:  New Property.  self.current is current execution step pointer
    var step = self.steps[self.step++];
    if (utils.isFunction(step)) {
        self.runStep(step);
        step.executed = true;                 // Added:  This navigation step is executed already or not.
    } else {
        self.result.time = new Date().getTime() - self.startTime;
        self.log(f("Done %s steps in %dms", self.steps.length, self.result.time), "info");
        clearInterval(self.checker);
        self.emit('run.complete');
        if (utils.isFunction(onComplete)) {
            try {
                onComplete.call(self, self);
            } catch (err) {
                self.log("Could not complete final step: " + err, "error");
            }
        } else {
            // default behavior is to exit
            self.exit();
        }
    }
};


/**
 * Revised then() function for realizing label() and goto()
 * Every revised points are commented.
 *
 * @param  function  step  A function to be called as a step
 * @return Casper
 */
casper.then = function then(step) {
    if (!this.started) {
        throw new CasperError("Casper not started; please use Casper#start");
    }
    if (!utils.isFunction(step)) {
        throw new CasperError("You can only define a step as a function");
    }
    // check if casper is running
    if (this.checker === null) {
        // append step to the end of the queue
        step.level = 0;
        this.steps.push(step);
        step.executed = false;                 // Added:  New Property. This navigation step is executed already or not.
        this.emit('step.added', step);         // Moved:  from bottom
    } else {

      if( !this.steps[this.current].executed ) {  // Added:  Add step to this.steps only in the case of not being executed yet.
        // insert substep a level deeper
        try {
//          step.level = this.steps[this.step - 1].level + 1;   <=== Original
            step.level = this.steps[this.current].level + 1;   // Changed:  (this.step-1) is not always current navigation step
        } catch (e) {
            step.level = 0;
        }
        var insertIndex = this.step;
        while (this.steps[insertIndex] && step.level === this.steps[insertIndex].level) {
            insertIndex++;
        }
        this.steps.splice(insertIndex, 0, step);
        step.executed = false;                    // Added:  New Property. This navigation step is executed already or not.
        this.emit('step.added', step);            // Moved:  from bottom
      }                                           // Added:  End of if() that is added.

    }
//    this.emit('step.added', step);   // Move above. Because then() is not always adding step. only first execution time.
    return this;
};


/**
 * Adds a new navigation step by 'then()'  with naming label
 *
 * @param    String    labelname    Label name for naming execution step
 */
casper.label = function label( labelname ) {
  var step = new Function('"empty function for label: ' + labelname + ' "');   // make empty step
  step.label = labelname;                                 // Adds new property 'label' to the step for label naming
  this.then(step);                                        // Adds new step by then()
};

/**
 * Goto labeled navigation step
 *
 * @param    String    labelname    Label name for jumping navigation step
 */
casper.goto = function goto( labelname ) {
  for( var i=0; i<this.steps.length; i++ ){         // Search for label in steps array
      if( this.steps[i].label == labelname ) {      // found?
        this.step = i;                              // new step pointer is set
      }
  }
};
// End of Extending Casper functions for realizing label() and goto()
//================================================================================
//================================================================================



//================================================================================
//================================================================================
// Extending Casper functions for dumpSteps()

/**
 * Dump Navigation Steps for debugging
 * When you call this function, you cat get current all information about CasperJS Navigation Steps
 * This is compatible with label() and goto() functions already.
 *
 * @param   Boolen   showSource    showing the source code in the navigation step?
 *
 * All step No. display is (steps array index + 1),  in order to accord with logging [info] messages.
 *
 */
casper.dumpSteps = function dumpSteps( showSource ) {
  this.echo( "=========================== Dump Navigation Steps ==============================", "RED_BAR");
  if( this.current ){ this.echo( "Current step No. = " + (this.current+1) , "INFO"); }
  this.echo( "Next    step No. = " + (this.step+1) , "INFO");
  this.echo( "steps.length = " + this.steps.length , "INFO");
  this.echo( "================================================================================", "WARNING" );

  for( var i=0; i<this.steps.length; i++){
    var step  = this.steps[i];
    var msg   = "Step: " + (i+1) + "/" + this.steps.length + "     level: " + step.level
    if( step.executed ){ msg = msg + "     executed: " + step.executed }
    var color = "PARAMETER";
    if( step.label    ){ color="INFO"; msg = msg + "     label: " + step.label }

    if( i == this.current ) {
      this.echo( msg + "     <====== Current Navigation Step.", "COMMENT");
    } else {
      this.echo( msg, color );
    }
    if( showSource ) {
      this.echo( "--------------------------------------------------------------------------------" );
      this.echo( this.steps[i] );
      this.echo( "================================================================================", "WARNING" );
    }
  }
};

// End of Extending Casper functions for dumpSteps()
//================================================================================
//================================================================================



//================================================================================
//   Display 1 to 10 by loop like  do{...}while(...)

casper.start();

    casper.then(function() {
        this.echo( "Display 1 to 10 by loop like  do{...}while(...)" );
    });

    var counter=0;
    casper.label( "LOOP_START" );    // LOOP_START label here:  *** DO NOT put then() around label() for labeling ***

        casper.then(function() {
            counter++;
            this.echo( counter );
        });

    casper.then(function() {         // *** NEED to put then() around goto() ***
        if( counter<10 ){ this.goto( "LOOP_START" ); }     // conditional jump for making loop like  do{...}while(...)
    });

casper.run( function() {
  this.dumpSteps( true );  // Dump Navigation Steps;  You can comment out this line.
  this.exit();
});

//================================================================================
