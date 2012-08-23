/*!
 *  This script is demonstrating the new CasperJS Navigation Step Flow Control
 *  by adding new functions label() and goto().
 *
 *  As a sample, this 'googleranking.js' is obtaining the site ranking from 
 *  Google search result pages, by using infinite loop and conditional jump with 
 *  new functions label() and goto() that current CasperJS does not have yet.
 * 
 *  In addition, Dump Navigation Steps by dumpSteps() function will be displayed 
 *  after the ranking list.
 */

//================================================================================

var casper = require('casper').create({
//    verbose: true,          // true or false
//    logLevel: 'debug',      // 'debug' 'info' 'warning' 'error'
    pageSettings: { // It seems to need to emulate Chrome for getting pure href.
        userAgent: 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.79 Safari/537.1'
    }
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
//  Function getLinks() from googlelinks.js 
//    (https://github.com/n1k0/casperjs/blob/master/samples/googlelinks.js)

function getLinks() {
    var links = document.querySelectorAll("h3.r a");
    return Array.prototype.map.call(links, function(e) {
        return e.getAttribute("href");
    });
};

//================================================================================
//   Parameters (Global Variables)

var  google_url       = "http://www.google.com/?hl=en";
var  key_word         = "PhantomJS";
var  ranking_url      = "http://casperjs.org";
var  ranking_counter  = 0;
var  ranking_result   = 0;
var  ranking_max      = 100;
var  page_counter     = 0;

//================================================================================
//   CasperJS Navigation Step Description for Google Ranking

casper.start( google_url );     // Navigation Step start and open Google Top Page

    casper.then(function() {                 // STEP:  Show Start Title
        this.echo( "<<<< Google Ranking >>>>      KeyWord=[" + key_word + "]    SiteURL:[" + ranking_url + "]    ", "INFO_BAR"  );
    });

    casper.then(function() {                 // STEP:  Starting search the key_word on Google top page.
        this.fill('form[action="/search"]', {q: key_word}, true);
    });

    casper.label( "LOOP_START" );            // STEP:  LOOP_START label here:  *** DO NOT put then() around label() for labeling

        casper.then(function() {             // STEP:  Wait 3 seconds in order not to be considered SPAM
            this.wait( 3*1000 );
        });

        casper.then(function() {             // STEP:  Get array of href and check URL. if found out or over max, goto LOOP_END
            page_counter++;
            links = this.evaluate(getLinks);       // Get array of href
            for( i in links ) {
                ranking_counter++;
                if( links[i].indexOf(ranking_url) != -1 ) {  // match?
                    casper.goto( "LOOP_END" );               // conditional jump to end of loop (like 'break')
                    ranking_result = ranking_counter;        //  *** Even being executed goto(), rest of code in this STEP will be executed.
                    this.echo( " * " + ranking_counter + " " + links[i], "INFO" );
                } else {
                    this.echo( "   " + ranking_counter + " " + links[i]  );
                }
            }
            if( ranking_max <= ranking_counter ) { casper.goto( "LOOP_END" ); }   // over max? conditional jump to end of loop (like 'break')
        });

        casper.then(function() {             // STEP:  Click 'Next'
            this.click('a#pnnext')
        });

    casper.then(function() {                 // STEP:  Loop     *** NEED to put then() around goto()
        casper.goto( "LOOP_START" );         // unconditional jump for making infinite loop
    });

    casper.label( "LOOP_END" );              // STEP:  LOOP_END label here:   *** DO NOT put then() around label() for labeling

    casper.then(function() {                 // STEP:  Show Ranking Result
        this.echo( "<<<< Google Ranking Result >>>>      KeyWord=[" + key_word + "]    SiteURL:[" + ranking_url + "]    ", "INFO_BAR" );
        if( ranking_result == 0 ){
            this.echo( "Out of Ranking " + ranking_max, "WARNING" );
        } else {
            this.echo( " Ranking No. " + ranking_result + "      in Page: " + page_counter, "INFO" );
        }
    });


casper.run( function() {   // The End of Navigation Step
  this.echo( "\n\n\n" );
  this.dumpSteps( true );  // Dump Navigation Steps;  You can comment out this line.
  this.exit();
});

//================================================================================
