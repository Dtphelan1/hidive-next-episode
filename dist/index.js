function addNextButton(nextEpisodeUrl) {
  const player = document.getElementById("rmpPlayer");

  fetch(browser.runtime.getURL("/images/next-btn.svg"))
    .then((response) => response.text())
    .then((data) => {
      // Because of hidive's weird loading logic, the button might still be in the page from a previous viewing session
      let nextButton;
      function onNextClick(e) {
        e.stopPropagation();
        window.location.assign(nextEpisodeUrl);
      }
      if (document.getElementById("next-button")) {
        // If we already have a button, just update its click handler
        nextButton = document.getElementById("next-button");
        nextButton.onclick = onNextClick;
      } else {
        // Otherwise, make a next button and add it to the player
        const newDiv = document.createElement("div");
        newDiv.setAttribute("id", "next-button");
        newDiv.setAttribute("class", "next-button rmp-module");
        newDiv.innerHTML = data;
        nextButton = newDiv;
        nextButton.onclick = onNextClick;
        player.appendChild(nextButton);
      }
      // console.log("appended BUTTON");
      // console.log(nextButton);
    })
    .catch((err) => {
      // handle error
    });
}

// Return true if the nextEpURL is valid
async function checkNextEp(nextEpisodeUrl) {
  return (
    fetch(nextEpisodeUrl)
      // Page needs to be valid and match the URL we requested, in order to handle redirects gracefully
      .then(function (resp) {
        return resp.url === nextEpisodeUrl;
      })
      .catch(function () {
        return false;
      })
  );
}

// Left pad with zeros to create a valid string-representation of an episode number
function padNum(num) {
  const padding = "0".repeat(3 - String(num).length);
  return String(padding) + String(num);
}

async function main() {
  const player = document.getElementById("rmpPlayer");
  if (player) {
    // console.log("has player");
    // console.log(player);
    const url = window.location.href;
    const splitUrl = url.split("/");
    // Current episode info tells us the season and episode number
    const currentEpisodeInfo = splitUrl.at(-1);
    // As of Sept 1, 2023 Hidive represents episodes as three-digit numbers at the end of the Season/Episode string
    const currentEpisodeNum = currentEpisodeInfo.slice(
      currentEpisodeInfo.length - 3,
      currentEpisodeInfo.length
    );
    const nextEpisodeNum = padNum(Number(currentEpisodeNum) + 1);
    const nextEpisodeInfo =
      currentEpisodeInfo.slice(0, currentEpisodeInfo.length - 3) +
      nextEpisodeNum;
    // console.log(nextEpisodeInfo);
    // To make the next-episode url, take the current url sans number and append the new number
    const nextEpisodeArray = splitUrl.slice(0, splitUrl.length - 1);
    nextEpisodeArray.push(nextEpisodeInfo);
    const nextEpisodeUrl = nextEpisodeArray.join("/");
    // console.log(nextEpisodeUrl);
    const hasNextEp = await checkNextEp(nextEpisodeUrl);
    if (hasNextEp) {
      // console.log("there is a valid next ep");
      // HACKY: Wait a second before loading to let the rest of the player load
      setTimeout(function () {
        addNextButton(nextEpisodeUrl);
      }, 3000);
    } else {
      // console.log("NO VALID NEXT EP");
      return;
    }
  }
}

// Run our extension on page load
window.onload = main;

// Since hidive doesn't load new pages using pushstate, we need to track the url manually for user-driven new-ep navigation
let previousUrl = "";
const observer = new MutationObserver(function (mutations) {
  if (window.location.href !== previousUrl) {
    previousUrl = window.location.href;
    // console.log(`URL changed from ${previousUrl} to ${window.location.href}`);
    main();
  }
});
const config = { subtree: true, childList: true };

// start listening to changes
observer.observe(document, config);

// stop listening to changes
window.onunload = () => observer.disconnect();
