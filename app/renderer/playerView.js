// ROBIN: Needed so we can check char counts.
const settings = require("electron-settings");

const $ = window.jQuery = require('./jquery-2.2.3.min.js');

var events = {};
var lastFadeTime = 0;
var $textBuffer = null;


document.addEventListener("keyup", function(){
    $("#player").removeClass("altKey");
});
document.addEventListener("keydown", function(){
    $("#player").addClass("altKey");
});

// Initial default: append to visible buffer
$textBuffer = $("#player .innerText.active");

function shouldAnimate() {
    return $textBuffer.hasClass("active");
}

function showSessionView(sessionId) {
    var $player = $("#player");

    var $hiddenContainer = $player.find(".hiddenBuffer");
    var $hidden = $hiddenContainer.find(".innerText");

    var $active = $("#player .innerText.active");
    if( $active.data("sessionId") == sessionId ) {
        return;
    }

    if( $hidden.data("sessionId") == sessionId ) {
        // Swap buffers
        $active.removeClass ("active");
        $hiddenContainer.append($active);
        $hidden.insertBefore($hiddenContainer);
        $hidden.addClass("active");

        // Also make this the active buffer
        $textBuffer = $hidden;
    }
}

function fadeIn($jqueryElement) {

    const minimumTimeSeparation = 250;
    const animDuration = 500;

    var currentTime = Date.now();
    var timeSinceLastFade = currentTime - lastFadeTime;

    var delay = 0;
    if( timeSinceLastFade < minimumTimeSeparation )
        delay = minimumTimeSeparation - timeSinceLastFade;

    $jqueryElement.css("opacity", 0);
    $jqueryElement.delay(delay).animate({opacity: 1.0}, animDuration);

    lastFadeTime = currentTime + delay;
}

function contentReady() {

    // Expand to fit
    var newHeight = $textBuffer[0].scrollHeight;
    if( $textBuffer.height() < newHeight )
        $textBuffer.height(newHeight);

    // Scroll to bottom?
    if( shouldAnimate() ) {
        var offset = newHeight - $("#player .scrollContainer").outerHeight();
        if( offset > 0 && offset > $("#player .scrollContainer").scrollTop() ) {
            $("#player .scrollContainer").animate({
                scrollTop: offset
            }, 500);
        }
    }
}

function prepareForNewPlaythrough(sessionId) {

    $textBuffer = $("#player .hiddenBuffer .innerText");
    $textBuffer.data("sessionId", sessionId);

    $textBuffer.text("");
    $textBuffer.height(0);
}

// ROBIN: Most of our edits are in this function.
function addTextSection(text)
{
    var $paragraph = $("<p class='storyText'></p>");

    var highlightedText;

    // Split individual words into span tags, so that they can be underlined
    // when the user holds down the alt key, and so that they can be individually
    // clicked in order to jump to the source.

    // But first, let's parse out carrot tags so they are styled correctly but
    // don't screw with the word count

    // Split the line if we have a >>
    var splitOnCarrotTags = text.split(">>");
    var nonTagText = splitOnCarrotTags.shift();

    // Reconstitute the rest of the line that has tags
    var tagText = "";
    if (splitOnCarrotTags.length > 0) {
        tagText = ">>" + splitOnCarrotTags.join(">>");
    }

    // If all we have left is a character name, style that like a tag

    if (/[A-Z]+:\s*$/.test(nonTagText)) {
        tagText = nonTagText + tagText;
        nonTagText = "";
    }

    var arrayOfWords = nonTagText.split(" ");
    var dialogueRegex = /^[A-Z]+:/
    var isDialogueLine = dialogueRegex.test(arrayOfWords[0]);

    var plainSpans = [];
    var highlightedSpans = [];

    if (settings.getSync("enforceCharCounts")) {
        // ROBIN: Enforce character counts on this <p>.
        let charCount = 0;
        const MAX_NARRATION_COUNT = settings.getSync("narrativeCountDanger");
        const MAX_DIALOGUE_COUNT = settings.getSync("dialogCountDanger");

        console.log(MAX_NARRATION_COUNT, MAX_DIALOGUE_COUNT, arrayOfWords)
        const dangerousWordCount = isDialogueLine ? MAX_DIALOGUE_COUNT : MAX_NARRATION_COUNT;
        for (var i = 0; i < arrayOfWords.length; i++) {
          var currentWord = arrayOfWords[i];
          charCount += currentWord.length;
          if (charCount < dangerousWordCount) {
              plainSpans.push(currentWord);
          } else {
            console.log (currentWord, charCount, dangerousWordCount);
            highlightedSpans.push(currentWord);
          }
        }
    } else {
        // ROBIN: We are not enforcing any character counts, so...
        plainSpans = arrayOfWords;
    }

    var isLina = (arrayOfWords[0] === 'LINA:');

    let initialSpan = "<span>";
    if (isDialogueLine && isLina) {
      initialSpan = "<span class='characterName Lina'>‍"
    } else if (isDialogueLine) {
      initialSpan = "<span class='characterName notLina'>"
    }

    var textAsSpans = initialSpan + plainSpans.join("</span> <span>") + "</span>";

    if (highlightedSpans.length > 0) {
        // ROBIN: Note the space at the front here. Fussy.
        textAsSpans += " <span class='charCountWarning'>" + highlightedSpans.join("</span> <span class='charCountWarning'>") + "</span>";
    }
    if (tagText.length > 0) {
        textAsSpans += ` <span class='carrotTags'>${tagText}</span`;
    }

    $paragraph.html(textAsSpans);

    // Keep track of the offset of each word into the content,
    // starting from the end of the last choice (it's global in the current play session)
    var previousContentLength = 0;
    var $existingLastContent = $textBuffer.children(".storyText").last();
    if( $existingLastContent ) {
        var range = $existingLastContent.data("range");
        if( range ) {
            previousContentLength = range.start + range.length + 1; // + 1 for newline
        }
    }
    $paragraph.data("range", {start: previousContentLength, length: text.length});

    // Append the actual content
    $textBuffer.append($paragraph);

    // Find the offset of each word in the content, for clickability
    var offset = previousContentLength;
    $paragraph.children("span").each((i, element) => {
        var $span = $(element);
        var length = $span.text().length;
        $span.data("range", {start: offset, length: length});
        offset += length + 1; // extra 1 for space
    });

    // Alt-click handler to jump to source
    $paragraph.find("span").click(function(e) {
        if( e.altKey ) {

            var range = $(this).data("range");
            if( range ) {
                var midOffset = Math.floor(range.start + range.length/2);
                events.jumpToSource(midOffset);
            }

            e.preventDefault();
        }
    });
    if (shouldAnimate()) {
        fadeIn($paragraph);
    }

}

function addTags(tags)
{
    var tagsStr = tags.join(", ");
    var $tags = $(`<p class='tags'># ${tagsStr}</p>`);

    $textBuffer.append($tags);

    if( shouldAnimate() )
        fadeIn($tags);
}

function addChoice(choice, callback)
{
    // Style the carrot tags
    let carrotIndex = choice.text.indexOf(">>");
    let text = choice.text;
    let $tags = null;

    if (carrotIndex != -1) {
        let tagText = text.substr(carrotIndex);
        text = text.substr(0, carrotIndex);
        $tags = $(`<span class='carrotTags'>${tagText}</span>`);
    }
    var $choice = $("<a href='#'>"+text+"</a>");

    // Append the choice
    var $choicePara = $("<p class='choice'></p>");
    $choicePara.append($choice);
    if ($tags != null) {
        $choicePara.append($tags);
    }
    $textBuffer.append($choicePara);

    if( shouldAnimate() ) {
        fadeIn($choicePara);
    }

    // When this choice is clicked...
    $choice.on("click", (event) => {

        var existingHeight = $textBuffer.height();
        $textBuffer.height(existingHeight);

        // Remove any existing choices, and add a divider
        $(".choice").remove();
        $textBuffer.append("<hr/>");

        event.preventDefault();

        callback();
    });
}

function addTerminatingMessage(message, cssClass)
{
    var $message = $(`<p class='${cssClass}'>${message}</p>`);
    $textBuffer.append($message);

    if( shouldAnimate() )
        fadeIn($message);
}

function addLongMessage(message, cssClass)
{
    var $message = $(`<pre class='${cssClass}'>${message}</pre>`);
    $textBuffer.append($message);

    if( shouldAnimate() )
        fadeIn($message);
}

function addHorizontalDivider()
{
    $textBuffer.append("<hr/>");
}

function addLineError(error, callback)
{
    var $aError = $("<a href='#'>Line "+error.lineNumber+": "+error.message+"</a>");
    $aError.on("click", callback);

    var $paragraph = $("<p class='error'></p>");
    $paragraph.append($aError);
    $textBuffer.append($paragraph);
}

function addEvaluationResult(result, error)
{
    var $result;
    if( error ) {
        $result = $(`<div class="evaluationResult error"><span>${error}</span></div>`);
    } else {
        $result = $(`<div class="evaluationResult"><span>${result}</span></div>`);
    }
    $textBuffer.append($result);
}

function previewStepBack()
{
    var $lastDivider = $("#player .innerText.active").find("hr").last();
    $lastDivider.nextAll().remove();
    $lastDivider.remove();
}

exports.PlayerView = {
    setEvents: (e) => { events = e; },
    contentReady: contentReady,
    prepareForNewPlaythrough: prepareForNewPlaythrough,
    addTextSection: addTextSection,
    addTags: addTags,
    addChoice: addChoice,
    addTerminatingMessage: addTerminatingMessage,
    addLongMessage: addLongMessage,
    addHorizontalDivider: addHorizontalDivider,
    addLineError: addLineError,
    addEvaluationResult: addEvaluationResult,
    showSessionView: showSessionView,
    previewStepBack: previewStepBack
};
