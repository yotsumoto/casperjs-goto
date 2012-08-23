/*!
 *  This script is demonstrating the extending Casper functions dumpSteps().
 *  You can try QUIZ and understand the CasperJS Navigation Steps order mechanism.
 */

//================================================================================

var casper = require('casper').create({
//    verbose: true,          // true or false
//    logLevel: 'debug',      // 'debug' 'info' 'warning' 'error'
});

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
//   QUIZ: What is the display order?
//
//     A-B-C-D-E-F or F-E-D-C-B-A or ..... ?
//
casper.start();

    casper.thenOpen( "http://google.com",  function() {
        casper.echo( "A" );
    });

    casper.echo( "B" );

    casper.then(function() {
        casper.then(function() {
            casper.echo( "C" );
        });
       casper.echo( "D" );
    });

    casper.echo( "E" );

    casper.then(function() {
        casper.echo( "F" );
    });

casper.run( function() {
  this.dumpSteps( true );  // Dump Navigation Steps
  this.exit();
});

//================================================================================
