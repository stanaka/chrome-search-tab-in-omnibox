function encodeHTML(str) {
  return str.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&apos;');
}

// https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
function escapeRegex(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function removeFragment(string) {
  return string.replace(/#[^#]*/, '')
}

/*
chrome.omnibox.onInputStarted.addListener(
  function() {
    chrome.tabs.query({}, function(tabs) {
      currentTabs = tabs;
      console.log(tabs)
    });
  });
*/

var suggests = [];

chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
    console.log('inputChanged: ' + text);

    chrome.tabs.query({}, function(tabs) {

      if (!Array.isArray(tabs)) return;

      suggests = [];
      tabs.some(function(tab) {
        if (tab.title.toLowerCase().indexOf(text) != -1 || tab.url.toLowerCase().indexOf(text) != -1) {
          var desc = "";
          var title = encodeHTML(tab.title);
          
          var re = new RegExp("("+escapeRegex(text)+")","gi");
          title = title.replace(re, "<match>$1</match>");
          desc += title + " <url>" + encodeHTML(tab.url) + "</url>";
          suggests.push(
            {
              content: tab.url,
              description: desc
            }
          ) 
          if (suggests.length === 5) {
            return true;
          }
        }
      })

      console.log(suggests);
      var first = suggests.shift();
      chrome.omnibox.setDefaultSuggestion({
        description: first.description
      });
      suggest(suggests);
    });
  });

chrome.omnibox.onInputEntered.addListener(
  function(text) {
    text = removeFragment(text)
    console.log(text);
    chrome.tabs.query({url: text}, function(tabs) {
      console.log(tabs);
      if (tabs === undefined) {
        text = removeFragment(suggests[0].content)
        console.log(text);
        chrome.tabs.query({url: text}, function(tabs) {
          chrome.tabs.update(tabs[0].id, {highlighted: true});
        });
      } else {
        chrome.tabs.update(tabs[0].id, {highlighted: true});
      }
    });
  });
