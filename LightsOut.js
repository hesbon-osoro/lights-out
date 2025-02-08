// Add an event listener for the DOMContentLoaded event
window.addEventListener("DOMContentLoaded", domLoaded);

// Declare the object that stores information about the current game 
const currentGame = {
  "rowCount": 3,
  "columnCount": 3,
  "lights": [
    true, true, true,
    true, true, true,
    true, true, true
  ],
  "startTime": new Date(),

  // Next two properties are for auto-solving
  "toggleHistory": [],
  "autoSolveIntervalID": 0
};

// Settings object to store user preferences
const userSettings = {
  gridSize: 3,
  lightOnColor: "#ffff00", // Yellow
  lightOffColor: "#000000" // Black
};

// Returns true if all lights in the game grid are off, false otherwise.
function allLightsOut(game) {
  for (let i = 0; i < game.lights.length; i++) {
    // Even one light being on implies that not all are out/off
    if (game.lights[i]) {
      return false;
    }
  }

  // All lights were checked and none are on, so lights are out!
  return true;
}

// Checks to see if the game is won. If so, a message is displayed in the 
// information <div> and true is returned. Otherwise false is returned.
function checkForWin(game) {
  if (allLightsOut(game)) {
    // Compute the time taken to solve the puzzle
    const now = new Date();
    const timeTaken = Math.floor((now - game.startTime) / 1000);

    // Display message
    const infoDIV = document.getElementById("information");
    infoDIV.innerHTML = "You win! Solved in " + timeTaken + " seconds";

    // If active, clear the auto-solve interval
    if (game.autoSolveIntervalID) {
      clearInterval(game.autoSolveIntervalID);
      game.autoSolveIntervalID = 0;
    }

    return true; // game is won
  }

  return false; // game is not won
}

// Handles a click at the specified location. Toggles lights, updates
// the HTML grid on the page, and checks to see if the game is won.
function clickLight(game, row, column) {
  // Ignore if the game is already won or is auto-solving
  if (allLightsOut(game) || game.autoSolveIntervalID) {
    return;
  }

  // Toggle the appropriate lights
  toggle(game, row, column);

  // Store in toggle history so auto-solver can complete the game
  game.toggleHistory.push([row, column]);

  // Update the HTML grid
  updateGridButtons(game);

  // Check to see if the game is won
  checkForWin(game);
}

// Creates the grid of buttons that represents the lights and clears the 
// information <div>
function createGameBoard(game, is5x5) {
  // Get the grid <div> and clear existing content
  const gameGrid = document.getElementById("gameGrid");
  gameGrid.innerHTML = "";

  // Set the layout style based on game size
  gameGrid.className = is5x5 ? "grid5x5" : "grid3x3";

  // Create the grid of buttons
  for (let row = 0; row < game.rowCount; row++) {
    for (let column = 0; column < game.columnCount; column++) {
      // Create the button and append as a child to gameGrid
      const button = document.createElement("input");
      button.type = "button";
      gameGrid.appendChild(button);

      // Set the button's click event handler
      button.addEventListener("click", (e) => {
        clickLight(game, row, column);
      });
    }
  }

  // Update button styles from game.lights array
  updateGridButtons(game);

  // Clear the information <div>
  const infoDIV = document.getElementById("information");
  infoDIV.innerHTML = "";
}

// Called when the page's DOM content loads. Adds click event listeners and 
// starts a new 3x3 game.
function domLoaded() {
  // Add click event listener for the auto-solve button
  const btnAutoSolve = document.getElementById("solveForMeButton");
  btnAutoSolve.addEventListener("click", function () {
    // Disable solveForMeButton first
    btnAutoSolve.disabled = true;

    // Set the interval for making a step toward solving
    currentGame.autoSolveIntervalID = setInterval(() => {
      solveInterval(currentGame);
    }, 250);
  });

  // Add click event listeners for the two new game buttons
  const btn3x3 = document.getElementById("newGame3x3Button");
  btn3x3.addEventListener("click", function () {
    newGame(currentGame, false);
    btnAutoSolve.disabled = false;
  });
  const btn5x5 = document.getElementById("newGame5x5Button");
  btn5x5.addEventListener("click", function () {
    newGame(currentGame, true);
    btnAutoSolve.disabled = false;
  });

  // Add click event listener for the settings button
  const btnSettings = document.getElementById("settingsButton");
  btnSettings.addEventListener("click", function () {
    document.getElementById("settingsModal").style.display = "block";
  });

  // Add click event listener for the apply settings button
  const btnApplySettings = document.getElementById("applySettings");
  btnApplySettings.addEventListener("click", function () {
    applySettings();
  });

  // Add click event listener for the close settings button
  const btnCloseSettings = document.getElementById("closeSettings");
  btnCloseSettings.addEventListener("click", function () {
    document.getElementById("settingsModal").style.display = "none";
  });

  // Add event listeners for color pickers to update previews
  document.getElementById("lightOnColor").addEventListener("input", function () {
    const lightOnColor = this.value;
    document.getElementById("lightOnPreview").style.backgroundColor = lightOnColor;
  });

  document.getElementById("lightOffColor").addEventListener("input", function () {
    const lightOffColor = this.value;
    document.getElementById("lightOffPreview").style.backgroundColor = lightOffColor;
  });

  // Start a new 3x3 game
  newGame(currentGame, false);
}

// Resets to a random, winnable game with at least 1 light on
function newGame(game, is5x5) {
  // Clear the interval if auto-solving is happening
  if (game.autoSolveIntervalID) {
    clearInterval(game.autoSolveIntervalID);
    game.autoSolveIntervalID = 0;
  }

  // Set the number of rows and columns
  if (is5x5) {
    game.rowCount = 5;
    game.columnCount = 5;
  } else {
    game.rowCount = 3;
    game.columnCount = 3;
  }

  // Allocate the light array, with all lights off
  const lightCount = game.rowCount * game.columnCount;
  game.lights = [];
  for (let i = 0; i < lightCount; i++) {
    game.lights.push(false);
  }

  // Perform a series of random toggles, which generates a game grid
  // that is guaranteed to be winnable
  while (allLightsOut(game)) {
    // Reset the game's toggle history
    game.toggleHistory = [];

    // Generate random lights
    for (let i = 0; i < 20; i++) {
      const randRow = Math.floor(Math.random() * game.rowCount);
      const randCol = Math.floor(Math.random() * game.columnCount);

      // Toggle at the location
      toggle(game, randRow, randCol);

      // Store in toggle history so auto-solver can complete the game
      game.toggleHistory.push([randRow, randCol]);
    }
  }

  // Create the UI
  createGameBoard(game, is5x5);

  // Store the start time
  game.startTime = new Date();
}

function solveInterval(game) {
  // Action occurs only if the game is not yet won
  if (!checkForWin(game)) {
    // Pop the most recent move and apply to go back a step
    const lastMove = game.toggleHistory.pop();
    toggle(game, lastMove[0], lastMove[1]);

    // Update the HTML grid
    updateGridButtons(game);
  }
}

// Toggles the light at (row, column) and each orthogonally adjacent light
function toggle(game, row, column) {
  const locations = [
    [row, column],
    [row - 1, column],
    [row + 1, column],
    [row, column - 1],
    [row, column + 1]
  ];
  for (let location of locations) {
    row = location[0];
    column = location[1];
    if (row >= 0 && row < game.rowCount &&
      column >= 0 && column < game.columnCount) {
      // Compute array index
      const index = row * game.columnCount + column;

      // Toggle the light
      game.lights[index] = !game.lights[index];
    }
  }
}

// Updates the HTML grid's buttons based on game.lights
function updateGridButtons(game) {
  // Get the game grid <div>
  const gameGrid = document.getElementById("gameGrid");

  // Update grid buttons based on the game's light array entries
  for (let i = 0; i < game.lights.length; i++) {
    // Update the button's style based on the light state
    const button = gameGrid.children[i];
    button.className = game.lights[i] ? "lightOn" : "lightOff";
    button.style.backgroundColor = game.lights[i] ? userSettings.lightOnColor : userSettings.lightOffColor;
  }
}

// Applies user settings from the modal
function applySettings() {
  const gridSize = parseInt(document.getElementById("gridSize").value);
  const lightOnColor = document.getElementById("lightOnColor").value;
  const lightOffColor = document.getElementById("lightOffColor").value;

  // Update user settings
  userSettings.gridSize = gridSize;
  userSettings.lightOnColor = lightOnColor;
  userSettings.lightOffColor = lightOffColor;

  // Update the game grid
  currentGame.rowCount = gridSize;
  currentGame.columnCount = gridSize;

  // Set custom grid size CSS variable
  const gameGrid = document.getElementById("gameGrid");
  gameGrid.style.setProperty("--grid-size", gridSize);
  gameGrid.className = "gridCustom"; // Use custom grid class

  // Start a new game with the updated grid size
  newGame(currentGame, gridSize === 5);

  // Close the modal
  document.getElementById("settingsModal").style.display = "none";
}