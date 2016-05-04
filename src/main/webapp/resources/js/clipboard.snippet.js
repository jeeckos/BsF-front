var snippets = document.querySelectorAll('.snippet');
[].forEach.call(snippets, function (snippet) {
    snippet.firstElementChild.insertAdjacentHTML('beforebegin', '<button class="btn clipbtn" data-clipboard-snippet><img class="clippy" width="15" src="../resources/images/clippy.svg" alt="Copy to clipboard 2"></button>');
});
var clipboardSnippets = new Clipboard('[data-clipboard-snippet]', {
    target: function (trigger) {
        return trigger.nextElementSibling;
    }
});
clipboardSnippets.on('success', function (e) {
    e.clearSelection();
    showTooltip(e.trigger, 'Copied!');
});
clipboardSnippets.on('error', function (e) {
    showTooltip(e.trigger, fallbackMessage(e.action));
});

function showTooltip(elem, msg) {
    elem.setAttribute('class', 'btn tooltipped tooltipped-s');
    elem.setAttribute('aria-label', msg);
}

var btns = document.querySelectorAll('.clipbtn');
for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('mouseleave', function (e) {
        e.currentTarget.setAttribute('class', 'btn');
        e.currentTarget.removeAttribute('aria-label');
    });
}
/*
function fallbackMessage(action) {
    var actionMsg = '';
    var actionKey = (action === 'cut' ? 'X' : 'C');
    if (/iPhone|iPad/i.test(navigator.userAgent)) {
        actionMsg = 'No support :(';
    } 
    else if (/Mac/i.test(navigator.userAgent)) {
        actionMsg = 'Press ⌘-' + actionKey + ' to ' + action;
    } 
    else {
        actionMsg = 'Press Ctrl-' + actionKey + ' to ' + action;
    }
    return actionMsg;
}*/