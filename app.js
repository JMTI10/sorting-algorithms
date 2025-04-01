/****************************************
 * GLOBAL SETUP
 ****************************************/
const rows = 20;
const cols = 20;
let grid = [];

// Grab DOM elements
const gridContainer = document.getElementById('grid');
const visitedCountEl = document.getElementById('visitedCount');
const pathLengthEl = document.getElementById('pathLength');
const showHeuristicCheckbox = document.getElementById('showHeuristicCheckbox');

// A span to display algorithm time
function showAlgorithmTime(timeInMs) {
  const timeEl = document.getElementById('algoTime');
  timeEl.textContent = timeInMs.toFixed(2);
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
}

let animationSpeed = 20;
function updateSpeed() {
  const slider = document.getElementById('speedSlider');
  animationSpeed = parseInt(slider.value, 10);
  document.getElementById('speedValue').textContent = animationSpeed;
}

// Create a 2D array for the grid
for (let r = 0; r < rows; r++) {
  const row = [];
  for (let c = 0; c < cols; c++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.id = `cell-${r}-${c}`;

    const overlayDiv = document.createElement('div');
    overlayDiv.classList.add('overlay');
    cell.appendChild(overlayDiv);

    cell.addEventListener('click', () => {
      toggleWall(r, c);
    });

    gridContainer.appendChild(cell);

    row.push({
      row: r,
      col: c,
      isWall: false,
      isVisited: false,
      isFrontier: false,
      distance: Infinity,
      fScore: Infinity,
      gScore: Infinity,
      previous: null
    });
  }
  grid.push(row);
}

// Define start position
const startPos = { row: 0, col: 0 };
let endPos = { row: rows - 1, col: cols - 1 }; // Default bottom right

// Mark them visually
function placeStartEnd() {
  document.querySelectorAll('.start').forEach(e => e.classList.remove('start'));
  document.querySelectorAll('.end').forEach(e => e.classList.remove('end'));
  document.getElementById(`cell-${startPos.row}-${startPos.col}`).classList.add('start');
  document.getElementById(`cell-${endPos.row}-${endPos.col}`).classList.add('end');
}

// Call initially to place them
placeStartEnd();

// Button to randomize end position
const changeButton = document.createElement('button');
changeButton.textContent = 'Randomize End Position';
changeButton.style.marginBottom = '1rem';
changeButton.onclick = () => {
  let newEnd;
  do {
    newEnd = {
      row: Math.floor(Math.random() * rows),
      col: Math.floor(Math.random() * cols)
    };
  } while (newEnd.row === startPos.row && newEnd.col === startPos.col);

  endPos = newEnd;
  placeStartEnd();
};

document.body.insertBefore(changeButton, gridContainer);

/****************************************
 * HELPER FUNCTIONS
 ****************************************/
function toggleWall(r, c) {
  if ((r === startPos.row && c === startPos.col) ||
      (r === endPos.row && c === endPos.col)) {
    return; // Don't turn start/end into walls
  }
  const cellObj = grid[r][c];
  cellObj.isWall = !cellObj.isWall;

  const cellDiv = document.getElementById(`cell-${r}-${c}`);
  if (cellObj.isWall) {
    cellDiv.classList.add('wall');
  } else {
    cellDiv.classList.remove('wall');
  }
}

function resetGridState() {
  // Clear visited, frontier, distances, overlays
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellObj = grid[r][c];
      cellObj.isVisited = false;
      cellObj.isFrontier = false;
      cellObj.previous = null;
      cellObj.distance = Infinity;
      cellObj.fScore = Infinity;
      cellObj.gScore = Infinity;

      const cellDiv = document.getElementById(`cell-${r}-${c}`);
      cellDiv.classList.remove('visited', 'path', 'frontier');
      // We'll keep `.wall` if it’s there
      // Also do not remove .start/.end

      // Clear overlay text
      const overlayDiv = cellDiv.querySelector('.overlay');
      overlayDiv.style.display = 'none';
      overlayDiv.textContent = '';
    }
  }
  visitedCountEl.textContent = '0';
  pathLengthEl.textContent = '0';
  showAlgorithmTime(0); // reset time display at the start
}

function clearAlgorithmVisuals() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.getElementById(`cell-${r}-${c}`);
      cell.classList.remove('visited', 'frontier', 'path');
    }
  }
}

function getNeighbors(r, c) {
  const directions = [
    [0, 1], [0, -1], [1, 0], [-1, 0]
  ];
  const neighbors = [];
  for (const [dr, dc] of directions) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      neighbors.push(grid[nr][nc]);
    }
  }
  return neighbors;
}

// Reconstruct path from endCell -> startCell using `.previous`
function reconstructPath(endCell) {
  let current = endCell;
  const path = [];
  while (current !== null) {
    path.push(current);
    current = current.previous;
  }
  path.reverse();

  // Visually color the path
  for (let i = 0; i < path.length; i++) {
    const { row, col } = path[i];
    const cellDiv = document.getElementById(`cell-${row}-${col}`);
    cellDiv.classList.remove('visited', 'frontier');
    if (!(row === startPos.row && col === startPos.col) &&
        !(row === endPos.row && col === endPos.col)) {
      cellDiv.classList.add('path');
    }
  }
  // Update path length
  pathLengthEl.textContent = String(path.length);
}

// Utility: Update visitedCount display
function updateVisitedCount() {
  let visitedCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].isVisited) {
        visitedCount++;
      }
    }
  }
  visitedCountEl.textContent = String(visitedCount);
}

// Mark a cell as frontier (purple) or visited (blue)
function markFrontier(cellObj) {
  cellObj.isFrontier = true;
  const cellDiv = document.getElementById(`cell-${cellObj.row}-${cellObj.col}`);
  if (!cellDiv.classList.contains('start') && !cellDiv.classList.contains('end')) {
    cellDiv.classList.add('frontier');
  }
}
function markVisited(cellObj) {
  cellObj.isVisited = true;
  cellObj.isFrontier = false;
  const cellDiv = document.getElementById(`cell-${cellObj.row}-${cellObj.col}`);
  cellDiv.classList.remove('frontier');
  if (!cellDiv.classList.contains('start') && !cellDiv.classList.contains('end')) {
    cellDiv.classList.add('visited');
  }
  updateVisitedCount();
}

/****************************************
 * ALGORITHMS (all measure time)
 ****************************************/

// 1) BFS
function runBFS() {
  resetGridState();

  // Start timer
  const startTime = performance.now();

  const startCell = grid[startPos.row][startPos.col];
  const endCell = grid[endPos.row][endPos.col];

  const queue = [];
  queue.push(startCell);
  markVisited(startCell);

  // Animate BFS in intervals
  const interval = setInterval(() => {
    // If queue empty => done
    if (queue.length === 0) {
      clearInterval(interval);

      // End timer
      const endTime = performance.now();
      showAlgorithmTime(endTime - startTime);
      return;
    }

    const current = queue.shift();

    // If reached the end
    if (current === endCell) {
      clearInterval(interval);
      reconstructPath(endCell);

      // End timer
      const endTime = performance.now();
      showAlgorithmTime(endTime - startTime);
      return;
    }

    // Expand neighbors
    const neighbors = getNeighbors(current.row, current.col);
    for (const neighbor of neighbors) {
      if (!neighbor.isWall && !neighbor.isVisited) {
        neighbor.previous = current;
        markVisited(neighbor);
        queue.push(neighbor);
      }
    }
  }, animationSpeed);
}

// 2) DFS (iterative)
function runDFS() {
  resetGridState();

  // Start timer
  const startTime = performance.now();

  const startCell = grid[startPos.row][startPos.col];
  const endCell = grid[endPos.row][endPos.col];

  const stack = [];
  stack.push(startCell);
  markVisited(startCell);

  const interval = setInterval(() => {
    if (stack.length === 0) {
      clearInterval(interval);

      // End timer
      const endTime = performance.now();
      showAlgorithmTime(endTime - startTime);
      return;
    }

    const current = stack.pop();

    if (current === endCell) {
      clearInterval(interval);
      reconstructPath(endCell);

      // End timer
      const endTime = performance.now();
      showAlgorithmTime(endTime - startTime);
      return;
    }

    const neighbors = getNeighbors(current.row, current.col);
    for (const neighbor of neighbors) {
      if (!neighbor.isWall && !neighbor.isVisited) {
        neighbor.previous = current;
        markVisited(neighbor);
        stack.push(neighbor);
      }
    }
  }, animationSpeed);
}

// 3) Dijkstra
function runDijkstra() {
  resetGridState();

  // Start timer
  const startTime = performance.now();

  const startCell = grid[startPos.row][startPos.col];
  const endCell = grid[endPos.row][endPos.col];

  startCell.distance = 0;
  const pq = [startCell];
  markFrontier(startCell);

  const interval = setInterval(() => {
    if (pq.length === 0) {
      clearInterval(interval);

      // End timer
      const endTime = performance.now();
      showAlgorithmTime(endTime - startTime);
      return;
    }

    // Sort by smallest distance
    pq.sort((a, b) => a.distance - b.distance);
    const current = pq.shift();

    if (!current.isVisited) {
      markVisited(current);

      if (current === endCell) {
        clearInterval(interval);
        reconstructPath(endCell);

        // End timer
        const endTime = performance.now();
        showAlgorithmTime(endTime - startTime);
        return;
      }

      const neighbors = getNeighbors(current.row, current.col);
      for (const neighbor of neighbors) {
        if (!neighbor.isWall && !neighbor.isVisited) {
          const altDistance = current.distance + 1;
          if (altDistance < neighbor.distance) {
            neighbor.distance = altDistance;
            neighbor.previous = current;

            // If neighbor newly discovered, mark frontier and push
            if (!neighbor.isVisited && !neighbor.isFrontier) {
              markFrontier(neighbor);
              pq.push(neighbor);
            }
          }
        }
      }
    }
  }, animationSpeed);
}

// 4) A* 
function runAStar() {
  resetGridState();

  // Start timer
  const startTime = performance.now();

  const startCell = grid[startPos.row][startPos.col];
  const endCell = grid[endPos.row][endPos.col];

  // Manhattan distance
  function heuristic(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
  }

  startCell.gScore = 0;
  startCell.fScore = heuristic(startCell, endCell);

  if (showHeuristicCheckbox.checked) {
    const overlay = document.getElementById(`cell-${startCell.row}-${startCell.col}`)
      .querySelector('.overlay');
    overlay.textContent = `f=${startCell.fScore}`;
    overlay.style.display = 'block';
  }

  const openSet = [startCell];
  markFrontier(startCell);

  const interval = setInterval(() => {
    if (openSet.length === 0) {
      clearInterval(interval);

      // End timer
      const endTime = performance.now();
      showAlgorithmTime(endTime - startTime);
      return;
    }

    // Sort by smallest fScore
    openSet.sort((a, b) => a.fScore - b.fScore);
    const current = openSet.shift();

    if (!current.isVisited) {
      markVisited(current);

      if (current === endCell) {
        clearInterval(interval);
        reconstructPath(endCell);

        // End timer
        const endTime = performance.now();
        showAlgorithmTime(endTime - startTime);
        return;
      }

      const neighbors = getNeighbors(current.row, current.col);
      for (const neighbor of neighbors) {
        if (!neighbor.isWall && !neighbor.isVisited) {
          const tentativeG = current.gScore + 1;
          if (tentativeG < neighbor.gScore) {
            neighbor.previous = current;
            neighbor.gScore = tentativeG;
            neighbor.fScore = tentativeG + heuristic(neighbor, endCell);

            // Show heuristic if checked
            if (showHeuristicCheckbox.checked) {
              const overlayDiv = document
                .getElementById(`cell-${neighbor.row}-${neighbor.col}`)
                .querySelector('.overlay');
              overlayDiv.textContent = `f=${neighbor.fScore}`;
              overlayDiv.style.display = 'block';
            }

            if (!neighbor.isVisited && !neighbor.isFrontier) {
              markFrontier(neighbor);
              openSet.push(neighbor);
            }
          }
        }
      }
    }
  }, animationSpeed);
}

/****************************************
 * EXTRA FEATURES
 ****************************************/
function randomWalls(wallProbability = 0.35) {
  clearAlgorithmVisuals(); // Clear algorithm visuals first

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Skip start and end positions
      if ((r === startPos.row && c === startPos.col) || (r === endPos.row && c === endPos.col)) {
        continue;
      }

      // Randomly assign walls
      if (Math.random() < wallProbability) {
        grid[r][c].isWall = true;
        document.getElementById(`cell-${r}-${c}`).classList.add('wall');
      } else {
        grid[r][c].isWall = false;
        document.getElementById(`cell-${r}-${c}`).classList.remove('wall');
      }
    }
  }
}

function clearWalls() {
  clearAlgorithmVisuals(); // Clear algorithm visuals first
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].isWall = false;
      document.getElementById(`cell-${r}-${c}`).classList.remove('wall');
    }
  }
}

function randomizeEndPosition() {
  clearAlgorithmVisuals(); // Clear algorithm visuals first

  // Remove the current end position
  const currentEndCell = document.querySelector('.cell.end');
  if (currentEndCell) {
    currentEndCell.classList.remove('end');
  }

  // Randomly select a new end position
  const newEndRow = Math.floor(Math.random() * rows);
  const newEndCol = Math.floor(Math.random() * cols);

  // Set the new end position
  endPos = { row: newEndRow, col: newEndCol };
  document.getElementById(`cell-${newEndRow}-${newEndCol}`).classList.add('end');
}

// Dark mode preference handling
window.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('darkModeToggle');

  // Set dark mode as default if no preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || savedTheme === null) {
    document.body.classList.add('dark');
    toggle.checked = true;
    localStorage.setItem('theme', 'dark');
  }

  toggle.addEventListener('change', () => {
    const isDark = toggle.checked;
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
});

