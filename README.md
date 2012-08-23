CasperJS: Navigation Step Flow Control by label() and goto()
============================================================

###You can realize infinite loop, break, continue, switch case, etc... on CasperJS###



BACKGROUND
----------

I am using [CasperJS](http://casperjs.org/) for some my projects.
Thank you very much, [Nicolas](https://github.com/n1k0).

By the way, sometimes, I would like to describe the logic, like infinite loop and conditional break. 

For example:

```javascript
while(true) {
  DO SOMETHING
  if( CHECK CONDITION ) { break; }
  DO SOMETHING
}
```

However, I can not find out the solution in current CasperJS.

Of course, I studied that CasperJS has 
[repeat()](http://casperjs.org/api.html#casper.repeat) function,
and tried it.
But it seems that we have to provide finite number, and we can not
describe the conditional break out form the loop.

As a solution so far, 
Nicolas seems to suggest the sample 
[dynamic.js](https://github.com/n1k0/casperjs/blob/master/samples/dynamic.js).
But it's too complicated.
The script dynamic.js is using recursive function. 
That is not easy and memory problem occurs frequently.
I think that the original purpose of CasperJS is 
making it simple than 
[PhantomJS](http://phantomjs.org/) 
script.
But I don't think that dynamic.js is simple.

So, I tried to solve this problem by my own way.



SOLUTION
----------

According to 
[source code of the CasperJS](https://github.com/n1k0/casperjs/blob/master/modules/casper.js)
, it adds navigation step to Array `steps` with 
[then()](http://casperjs.org/api.html#casper.then)
 function or equivalent, like 
[thenOpen()](http://casperjs.org/api.html#casper.thenOpen)
 and 
[thenEvaluate()](http://casperjs.org/api.html#casper.thenEvaluate).
After that, CasperJS executes those steps in order and one by one synchronously.
This is the CasperJS' mechanism of synchronous execution system. (Wow! Great!)

Current CasperJS, however, the step execution is only sequentially.
That is why even 
[repeat()](http://casperjs.org/api.html#casper.repeat) function
has to expand the navigation step sequentially.
This means that CasperJS can not realize the infinite loop.
(If you have infinite memory, you can, maybe :-)

Therefore, I developed two new functions, `label()` and `goto()` for manipulating 
the navigation step execution order, and `dumpSteps()` for debugging.

+ `label()` can affix label on a point of navigation step.

+ `goto()` can jump to the labeled point of navigation step.

+ `dumpSteps()` can display the all information about navigation steps, including the label information.

In order to realize them, I revised the original function then() and checkStep()
as extending Casper functions.

Even though the `label()` and `goto()` are very primitive functions,
by making full use of those functions, we can realize the any execution flow control,
like infinite loop, conditional break or continue, switch case, and so on.


SAMPLE
------

I prepared following three sample scripts in this repository.

+ [infiniteloop.js](https://github.com/yotsumoto/casperjs-goto/blob/master/infiniteloop.js)

+ [do_while.js](https://github.com/yotsumoto/casperjs-goto/blob/master/do_while.js)

+ [googleranking.js](https://github.com/yotsumoto/casperjs-goto/blob/master/googleranking.js)

I checked above scripts on  [PhantomJS](http://phantomjs.org/) 1.6.1  +  [CasperJS](http://casperjs.org/) 1.0.0-RC1


### infiniteloop.js ###
This [infiniteloop.js](https://github.com/yotsumoto/casperjs-goto/blob/master/infiniteloop.js) sample 
is showing _the minimum infinite loop_ by `label()` and `goto()`.
The script is like following.

```javascript
casper.start();

    casper.label( "LOOP_START" );

        casper.then(function() {
            this.echo( "Showing This Message Forever !" );
        });

    casper.then(function() {
        this.goto( "LOOP_START" );
    });

casper.run();
```



### do_while.js ###
This [do_while.js](https://github.com/yotsumoto/casperjs-goto/blob/master/do_while.js) sample script 
is showing _Display 1 to 10 by loop like  do{...}while(...)_.
It includes conditional jump by `goto()` with `if()`.
In addition, this is showing *Dump Navigation Steps* by `dumpSteps()` at the end of script.
The script and output screen shot are following.

```javascript
casper.start();

    casper.then(function() {
        this.echo( "Display 1 to 10 by loop like  do{...}while(...)" );
    });

    var counter=0;
    casper.label( "LOOP_START" );

        casper.then(function() {
            counter++;
            this.echo( counter );
        });

    casper.then(function() {
        if( counter<10 ){ this.goto( "LOOP_START" ); }
    });

casper.run( function() {
  this.dumpSteps( true );
  this.exit();
});
```


![do_while.js screen shot](https://raw.github.com/yotsumoto/casperjs-goto/master/do_while.png)



### googleranking.js ###
This [googleranking.js](https://github.com/yotsumoto/casperjs-goto/blob/master/googleranking.js) sample is more useful.
You can get Google Ranking of your site.
In this sample, it shows ranking of site [http://casperjs.org](http://casperjs.org) from 
the Google multiple search result pages of key word _PhantomJS_.
The result screen shot is like following.
Of course, you can change those parameters if you like.

![googleranking.js screen shot](https://raw.github.com/yotsumoto/casperjs-goto/master/googleranking.png)






INSTALLATION
------------

The above three sample scripts have following two function groups of extending `casper` object.

+ `label()`, `goto()`, `then()` and `checkStep()`

+ `dumpSteps()`

You can just copy and paste these two function groups between `var casper = require('casper').create({...});` and `casper.start();`
on your script.


HOW TO USE
----------


### label() ###

`label()` have one label text as argument, and affix the label on that navigation step point.
You can jump into this navigation step point by `goto()`

Example:

    casper.label( "LOOP_START" ); 

For performance and easy coding, it does not have label duplication check routine now.

Another important point is that you DO NOT put `label()` inside `then()` function.
Because `label()` is automatically making new empty step and affix the label on it.
If you put `label()` inside `then()`, this means `then()` function will be nested,
and problems will occur. Please take care.

BAD Example

    NG:  casper.then(function() {
    NG:    casper.label( "LOOP_START" );
    NG:  });




### goto() ###

`goto()` also have one label text as argument that you want to go to.
If the label dose not exist, `goto()` does nothing.

Important point is that `goto()` function, contrary to `label()`, 
must be described inside `then()` function.

Example: unconditional jump

    casper.then(function() {
        this.goto( "LOOP_START" );
    });


Example: conditional jump with `if()`

    casper.then(function() {
        if( counter<10 ){ this.goto( "LOOP_START" ); } 
    });


Another important point is that 
even when `goto()` is executed, rest of code in that STEP will be executed.

Example

    casper.then(function() {
        this.echo( "Before goto()" );
        this.goto( "LOOP_START" );    // Unconditionally, this goto() is executed.
        this.echo( "After goto()" );  // This line also will be executed unconditionally.
    });

Because `goto()` is just changing the pointer of next step, and 
it continues the current step execution until the end of that step.



### dumpSteps() ###

`dumpSteps()` can display the all information about navigation steps, 
including the label information.
The argument is Boolean. If it is true, it shows function source code inside the step.
If not, it does not show the source code.

For debugging, you can write a following line at any location on your script, 
then you can get the dump of navigation steps at that point.

    casper.dumpSteps( true );  casper.exit();


Or you can put `dumpSteps()` at `run()` function in onComplete function like following.

    casper.run( function() {
        this.dumpSteps( true );
        this.exit();
    });



QUIZ
----
This is special additional quiz about CasperJS Navigation Step System for your fun.


### QUESTION: Which is the character display order? ###
**A-B-C-D-E-F or F-E-D-C-B-A or ..... ?**


```javascript
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

casper.run();
```

### [The Answer is Here!](https://github.com/yotsumoto/casperjs-goto/blob/master/quiz.png) ###


Thank you.

