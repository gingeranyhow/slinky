const $ = window.jQuery = require('./jquery-2.2.3.min.js');

var events = {};
var lastFadeTime = 0;
var $textBuffer = null;

// ROBIN: We are introducing the concept of "single lines" that restrict the display of text that follows them until they are "accepted."
var singleLineAcceptances = new Array();
var ignoreNextSingleLine = false;

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

    // Split individual words into span tags, so that they can be underlined
    // when the user holds down the alt key, and so that they can be individually
    // clicked in order to jump to the source.
    var splitIntoSpans = text.split(" ");
    var textAsSpans = "<span>" + splitIntoSpans.join("</span> <span>") + "</span>";

    $paragraph.html(textAsSpans);

    // ROBIN: Determine if we have a single line.
    //var isSingleLine = text.match(/^([A-Z\d\ ]+):/);
    var isSingleLine = text.match(/^LINA:/);

    if (isSingleLine && !ignoreNextSingleLine) {
        // ROBIN: For now, make these single lines look like choices. (We might change this appearance in the future.)
        $paragraph.addClass("singleLine");

        // ROBIN: We create a new jQuery Deferred object to control the rendering of subsequent text.
        singleLineAcceptances.push($.Deferred());

        // ROBIN: We tell the single line that Deferred object's index.
        $paragraph.data("deferred-index", singleLineAcceptances.length - 1);

        // ROBIN: Now we give the player a way to click and "resolve" that Deferred object.
        $paragraph.on("click", function(event) {
            // ROBIN: REMINDER! "this" is different in the => functions.
            // So, I am not using the => syntax.

            // ROBIN: When clicked, we access this single line's Deferred...
            var i = $(this).data("deferred-index");
            var deferred = singleLineAcceptances[i];

            // ROBIN: ...and resolve it, revealing the text below.
            deferred.resolve();
            event.preventDefault();
        });
    }

    // ROBIN: We always reset this.
    ignoreNextSingleLine = false;

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
        if (singleLineAcceptances.length == 0) {
            // ROBIN: Here, we haven't yet encountered a single line that must be accepted, so just draw text as normal.
            fadeIn($paragraph);
        } else {
            // ROBIN: Here, we have encountered at least one single line, so we need to link this item up with the appropriate line's Deferred.

            var deferred;

             if (!isSingleLine) {
                // ROBIN: This is normal text, so we make its reveal dependent on the most recent single line.
                deferred = singleLineAcceptances[singleLineAcceptances.length-1].promise();
            }

            if (isSingleLine && (singleLineAcceptances.length > 1)) {
                // ROBIN: We don't ever want to make a single line's reveal dependent on... itself... so we have to go back to the one before it. This is a bit fussy.
                deferred = singleLineAcceptances[singleLineAcceptances.length-2].promise();
            }

            if (deferred) {
                // ROBIN: Here, we hide this text until until the most recent single line is clicked.
                $paragraph.css("opacity", 0);
                $.when(deferred).then( (event) => {
                    fadeIn($paragraph);
                });
            } else {
                // ROBIN: We have no Deferred to attach, so just show it!
                fadeIn($paragraph);
            }
        }
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
    var $choice = $("<a href='#'>"+choice.text+"</a>");

    // Append the choice
    var $choicePara = $("<p class='choice'></p>");
    $choicePara.append($choice);
    $textBuffer.append($choicePara);

    // ROBIN: We have to apply our hiding logic to choices, too.
    if( shouldAnimate() ) {
        if (singleLineAcceptances.length > 0) {
            // ROBIN: Here, we have encountered a single line previously, so...
            var deferred = singleLineAcceptances[singleLineAcceptances.length-1].promise();
            $choicePara.css("opacity", 0);
            $.when(deferred).then( (event) => {
                fadeIn($choicePara);
            });
        }
    } else {
        // ROBIN: There haven't been any single lines, so just display as usual.
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

        // ROBIN: The Inky engine is about to place this choice text right back into the buffer, and we don't want to mistake it for a single line. Sooo...
        ignoreNextSingleLine = true;

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