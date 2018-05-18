var glob = require('glob'),
    fs = require('fs'),
    colors = require('colors/safe');
 
var defaultDir = '../Assets/Ink Files/';

// Run just against GDC rides
var filesToLint = defaultDir + 'GDCDemo/Rides/*.ink';


var sendOutputToStream = false;
var collectedOutput;
// OR, run against all Rides
// var filesToLint = defaultDir + '{,GDCDemo/}' + "Rides/{**,!(NotInUse)/}*.ink"
             
/* RUN LINTING TESTS */
/* Run the command `ava linter-test.js` within the test directory

/* TODO: 
Implement: 
1. react tag with an emote arg, and vice versa - invalid: >>react:happy >>emote:squint
2. discuss the new, skipped test with Andrew. Is it worth trying to handle ink tags with colons, or are we just
   reimplementing the Inky tag-parser. 
3. (Defer) Character tags with mis-spelled characters

/* REGEX PATTERNS */

const tagDelimiterWithPeriod = />>\s*(\w+):?[\s]{0,3}([\w{}]*)?\.?[\s]{0,3}(\w*)?/giu
const characterNamePattern = /^([A-Z]){3,}/u
const extractNameFromValidLine = /^[+*\s-]*[({]?[\w\s]*[()]*[)}]?[*\s-]*([A-Z]{3,}):/u
const checkForCommentedLine = /^\s*\/\//

// Ignores spaces, dashes, stars and ink tags preceding name.


/* LINTING REQUIREMENTS PER TAG CATEGORY*/

let charTagsParam = {
  tags: ['react', 'emote', 'skin', 'hud', 'intensity'], 
  linter: hasCharacterTagError,
  needsParam: true,
  validParams: {
    intensity: ["high", "medium", 'med', "low", 'h', 'm', 'l']
  }
}

let charTagsNoParam = {
  tags: ['paxFocus', 'paxIgnore', 'paxEnter', 'paxExit', 'paxLeft', 'paxRight'],
  linter: hasCharacterTagError,
  needsParam: false,
  validParams: {}
}

let storyTags = {
  tags: ['car', 'pause', 'setRide', 'cutCamera', 'lighting', 'sfx'],
  linter: hasStoryTagError,
  needsParam: true,
  validParams: {
    cutCamera: ['linapov', 'paxleft', 'paxright', 'dashcam', 'hoodcam', 'linafront', 'city']
  }
}

let tagsWithoutEvents = {
  linter: hasUITagError, 
  needsParam: true,
  tags: 
    ["id",
     "stars",
     "Title",
     "DisplayName",
     "Reviewers",
     "Length",
     "Bio",
     "Role",
     "Tone",
     "Difficulty",
     "FactRequirements",
     "Risk",
     "WC",
     "Version",
     "Themes",
     "Chapter",
     "Rating",
     "RatingCount",
     "AppearanceDescription",
     "Twitter",
     "AvatarDescription",
     "Author",
     "Draft",
     "Notes",
     "PickupLocation",
     "PickupNeighborhood",
     "DropoffLocation",
     "DropoffNeighborhood",
     "disabled",
     "UIView",
     /* "pause",*/ // This is in the story tag list. Confirm with patrick.
     "distance"
  ],
  validParams: {}
};

let uiTags = {
  linter: hasUITagError,
  needsParam: true, 
  tags: 
    ["UILabel",
     "UIButton",
     "UIImage",
     "UIFloat",
     "UIMovie"],
  validParams: {}
};

// build a single object with all tags and their parameter values

let tagsAndLinting = {};

for (tagType of [charTagsParam, uiTags, tagsWithoutEvents, charTagsNoParam, storyTags]) {
  for (tag of tagType.tags) {
    tagsAndLinting[tag.toLowerCase()] = {
      linter: tagType.linter,
      needsParam: tagType.needsParam,
      validParams: tagType.validParams[tag] || null
    }
  }
}

/* LINTING FUNCTIONS FOR VARIOUS TAG CATEGORIES */

function hasCharacterTagError(matchObject) {
  let decoratedMatchObject = decorateCharTags(matchObject);
  
  // run basic character tag linting
  if (checkForInValidCharacterTagForm(decoratedMatchObject)) return true;

  // check for parameters, if needed
  let needsParams = tagsAndLinting[matchObject.tagName] && tagsAndLinting[matchObject.tagName].needsParam === true;

  if (needsParams && !decoratedMatchObject.parameter) {
    logBadTag(`Character tag ${matchObject.tagName} requires params, but none found`, matchObject);
    return true;
  }

  // if there is a list of param validation, make sure the parameter is in the list
  if (hasInvalidParam(matchObject, decoratedMatchObject.parameter)) return true;

  return false;
}

// Linting to confirm character tags have a name and  valid type

function checkForInValidCharacterTagForm(decoratedMatchObject) {
  if (!decoratedMatchObject.character || !decoratedMatchObject.type) {
    logBadTag(`Character tag missing or malformed: ${decoratedMatchObject.fullTag}`, decoratedMatchObject);
    return true;
  } 

  if(!decoratedMatchObject.type) {
    logBadTag('Character type (inline or leadingName) could not be determined', decoratedMatchObject);
    return true;
  }

  return false;
}


function isValidPauseTag(matchObject) {
  let isInteger = string => typeof(parseInt(string)) === 'number';

  if (matchObject.tagName === 'pause' && isInteger(matchObject.semiColonArg) && (!matchObject.periodArg || isInteger(matchObject.periodArg))) {
    return true;
  }

  return false;
}


// Function that identifies the character name and parameters 
// for both of the two distint character types (inline and leading)
function decorateCharTags(matchObject) {
  // TYPE: inline
  // Valid inline character tags should have a name for the semicolon arg. examples:
    // >>paxEnter:FIONA
    // >>emote:FIONA.happy
    // >> paxEnter:{paxFirstName}
  // TYPE: leadingName
    // Otherwise, the name must be the first word of the line. Examples:
    // FIONA: Hey there! >>emote:happy
    // FIONA: >>paxEnter

  if (characterNamePattern.test(matchObject.semiColonArg)) {
    matchObject.type = 'inline';
    matchObject.character = matchObject.semiColonArg;
    matchObject.parameter = matchObject.periodArg;
    return matchObject;
  } 

  let charMatch = matchObject.line.match(extractNameFromValidLine);

  if (charMatch) {
    matchObject.type = 'leadingName';
    matchObject.character = charMatch[1]; // First group returned will be the name
    matchObject.parameter = matchObject.semiColonArg;
    return matchObject
  }

  // Otherwise, we have an issue
  matchObject.type = undefined;
  matchObject.character = undefined;
  return matchObject;
}

function hasStoryTagError(matchObject) {
  // story tags must have an argument after the semiColon
  if (!matchObject.semiColonArg) {
    logBadTag(`Story tag '${matchObject.tagName}' missing argument`, matchObject);
    return true; 
  }

  //some story tags have validation on their argument
  if (hasInvalidParam(matchObject, matchObject.semiColonArg)) return true;


  //story tags must have no argument after the period
  //unless it's a valid decimal-containing pause story tag
  if (matchObject.periodArg && !isValidPauseTag(matchObject)) {
    
    logBadTag(`Story tag '${matchObject.tagName}' malformed: ${matchObject.fullTag}`, matchObject);
    return true;
  }

  return false; 
}

function hasUITagError(matchObject) {
  // story tags must have an argument after the semiColon
  if (!matchObject.semiColonArg) {
    logBadTag(`UI tag '${matchObject.tagName}' missing argument`, matchObject);
    return true;
  }

  return false;
}

function hasInvalidParam(matchObject, param) {
  let validParams = tagsAndLinting[matchObject.tagName] && tagsAndLinting[matchObject.tagName].validParams;
  if (validParams && !validParams.includes(param.toLowerCase())) {
    logBadTag(`Parameter for '${matchObject.tagName}' is not allowed: ${matchObject.fullTag}`, matchObject);
    return true;
  }
  return false;
}


function isCommented(line) {
  return RegExp(checkForCommentedLine).test(line);
}

/* FILE THAT RUNS LINES AND FILES THROUGH LINTING*/ 

function logBadTag(message, matchObject) {
  let errorDetails = `${message}\n` + colors.yellow(matchObject.line);
  if (sendOutputToStream) {
    collectedOutput += `WARNING: '${matchObject.path}' line ${matchObject.lineIndex}: ${message}\n`;
  } else {
    console.log(`WARNING: '${matchObject.path}' line ${matchObject.lineIndex}: ${errorDetails}`);
  }
}

function lintInkFile(path) {
  let text = fs.readFile(path, 'utf8', function(err, data) {
    lintBuffer(data);
  });
}

function lintBuffer(path, data) {
    let lines = data.split("\n");
    for (let i = 0; i < lines.length; i++) {
      hasLineErrors(lines[i], i + 1, path);
    }
}

function lintFilesFromInky(inkFileBuffers) {
    sendOutputToStream = true;
    collectedOutput = "";

    for (var path in inkFileBuffers) {
        console.log(`Linting ${path}`);
        lintBuffer(path, inkFileBuffers[path]);
    }

    return collectedOutput;
}

function hasLineErrors(line, lineNumber, path) {
  let lineError = false;

  if (isCommented(line)) {
    return false;
  }

  do {
    match = tagDelimiterWithPeriod.exec(line);

    if (match) {
      let matchObject = {
        fullTag: match[0],
        tagName: match[1].toLowerCase(),
        semiColonArg: match[2],
        periodArg: match[3],
        lineIndex: lineNumber,
        path: path,
        line: line
      };
    //  console.log(matchObject)
      if (tagsAndLinting[matchObject.tagName]) {
        let lintingErrorFunction = tagsAndLinting[matchObject.tagName].linter;

        if (lintingErrorFunction(matchObject)) lineError = true;

      } else {
        logBadTag(`Unknown tag: '${matchObject.tagName}'`, matchObject);
        lineError = true;
      }
    }
  } while (match);

  return lineError;
}

glob(filesToLint, function( err, files ) {
  if( err ) {
      console.error( "Could not list the directory.", err );
      process.exit( 1 );
  } 
  
  files.forEach(lintInkFile);
  console.log('File to review:', files.length);
});

module.exports = hasLineErrors;
module.exports.lintFilesFromInky = lintFilesFromInky;
