"use strict";
const minX = 50;
const maxX = 1050;
const minY = 50;
const maxY = 1050;
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const nCompletedElement = document.getElementById("n_completed");
const timeElapsedElement = document.getElementById("time_elapsed");
const scoreElement = document.getElementById("score");
const fps_selector = document.getElementById("fps");
let fps = parseInt(fps_selector.value);
fps_selector.addEventListener("change", function () { fps = parseInt(fps_selector.value); });
const stopAfter_selector = document.getElementById("stop_after");
let stopAfter = parseInt(stopAfter_selector.value);
stopAfter_selector.addEventListener("change", function () { stopAfter = parseInt(stopAfter_selector.value); });
const canvas = document.getElementById("simulationCanvas");
const ctx = canvas.getContext("2d");
const agentCircleRadius = 10;
let taskRadius = 50;
let agentRadius = 1;
const taskCrossRadius = 10;
let animationFrame = -1;
let lastUpdateTime = 0;
let tasks = [];
let agents = [];
const nAgents_selector = document.getElementById("n_agents");
let nAgents = parseInt(nAgents_selector.value);
const taskCapacity_selector = document.getElementById("task_capacity");
let taskCapacity = parseInt(taskCapacity_selector.value);
function initAgents() {
    agents = [];
    for (let i = 0; i < nAgents; i++) {
        agents.push({
            x: Math.random() * (maxX - minX) + minX,
            y: Math.random() * (maxY - minY) + minY,
            nearby_tasks: []
        });
    }
}
const nTasks_selector = document.getElementById("n_tasks");
let nTasks = parseInt(nTasks_selector.value);
function initTasks() {
    for (let i = tasks.length; i < nTasks; i++) {
        tasks.push({
            x: Math.random() * (maxX - minX) + minX,
            y: Math.random() * (maxY - minY) + minY,
            nearby_agents: []
        });
    }
}
function drawTickLabel(label, x, y) {
    ctx.font = '16px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(label, x, y);
}
function drawAxis() {
    const boxX = minX;
    const boxY = minY;
    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    const tickLength = 10;
    const tickSpacing = 100;
    const labelOffset = 15;
    function drawYTicks() {
        ctx.textAlign = 'right';
        for (let y = boxY; y <= boxY + boxHeight; y += tickSpacing) {
            ctx.beginPath();
            ctx.moveTo(boxX, y);
            ctx.lineTo(boxX - tickLength, y);
            ctx.lineWidth = 2;
            ctx.stroke();
            drawTickLabel(`${(y - boxY)}`, boxX - labelOffset, y + 5);
        }
    }
    function drawXTicks() {
        ctx.textAlign = 'center';
        for (let x = boxX; x <= boxX + boxWidth; x += tickSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, boxY);
            ctx.lineTo(x, boxY - tickLength);
            ctx.lineWidth = 2;
            ctx.stroke();
            drawTickLabel(`${(x - boxX)}`, x, boxY - labelOffset);
        }
    }
    let textAlign = ctx.textAlign;
    drawYTicks();
    drawXTicks();
    ctx.textAlign = textAlign;
}
function drawLabel(x, y, label) {
    ctx.font = '16px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(label, x + 15, y - 15);
}
function drawAgent(x, y, id) {
    ctx.beginPath();
    ctx.arc(x, y, agentCircleRadius, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
    drawLabel(x, y, `R${id}`);
}
function drawTask(x, y, id) {
    const color = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - taskCrossRadius / 2, y - taskCrossRadius / 2);
    ctx.lineTo(x + taskCrossRadius / 2, y + taskCrossRadius / 2);
    ctx.moveTo(x - taskCrossRadius / 2, y + taskCrossRadius / 2);
    ctx.lineTo(x + taskCrossRadius / 2, y - taskCrossRadius / 2);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.lineWidth = 1;
    drawLabel(x, y, `T${id}`);
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(x, y, taskRadius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxis();
    for (let i = 0; i < nAgents; i++) {
        drawAgent(agents[i].x, agents[i].y, i);
    }
    for (let i = 0; i < nTasks; i++) {
        drawTask(tasks[i].x, tasks[i].y, i);
    }
}
function normX(x) {
    return Math.min(Math.max(minX, x), maxX);
}
function normY(y) {
    return Math.min(Math.max(minY, y), maxY);
}
let startTime = 0;
let nComplete = 0;
let timeElapsed = 0;
let score = 0;
function find_ndxs(arr, condition) {
    const matchingIndices = [];
    for (let i = 0; i < arr.length; i++) {
        if (condition(arr[i])) {
            matchingIndices.push(i);
        }
    }
    return matchingIndices;
}
function checkComplete() {
    for (let i = 0; i < nAgents; i++) {
        let agentX = agents[i].x;
        let agentY = agents[i].y;
        let nearbyTasks = find_ndxs(tasks, task => {
            let dist = Math.sqrt(Math.pow(agentX - task.x, 2) +
                Math.pow(agentY - task.y, 2));
            return dist <= taskRadius + agentRadius;
        });
        agents[i].nearby_tasks = nearbyTasks;
        for (let j = 0; j < nearbyTasks.length; j++) {
            let taskAgents = tasks[nearbyTasks[j]].nearby_agents;
            if (taskAgents.indexOf(i) < 0) {
                taskAgents.push(i);
            }
        }
    }
    for (let i = tasks.length - 1; i >= 0; i--) {
        let nearbyAgents = tasks[i].nearby_agents;
        if (nearbyAgents.length >= taskCapacity) {
            for (let j = 0; j < nearbyAgents.length; j++) {
                let nearbyTasks = agents[nearbyAgents[j]].nearby_tasks;
                nearbyTasks.splice(nearbyTasks.indexOf(i), 1);
            }
            tasks.splice(i, 1);
        }
    }
    timeElapsed += 1;
    nComplete += nTasks - tasks.length;
    score = nComplete / timeElapsed;
    initTasks();
}
function updateAgents() {
    for (let i = 0; i < nAgents; i++) {
        if (agents[i].nearby_tasks.length > 0) {
            continue;
        }
        const stepSize = 25;
        const angle = (Math.random() - 0.5) * Math.PI * 2;
        agents[i].x = normX(agents[i].x + Math.cos(angle) * stepSize);
        agents[i].y = normY(agents[i].y + Math.sin(angle) * stepSize);
    }
    checkComplete();
}
function update(currentTime) {
    const deltaTime = currentTime - lastUpdateTime;
    if (deltaTime < (1000 / fps)) {
        return;
    }
    updateAgents();
    draw();
    lastUpdateTime = currentTime;
}
function showScore() {
    nCompletedElement.innerText = nComplete.toString();
    timeElapsedElement.innerText = timeElapsed.toString();
    scoreElement.innerText = score.toString();
}
function stopMainLoop() {
    if (animationFrame !== -1) {
        cancelAnimationFrame(animationFrame);
        animationFrame = -1;
    }
    startButton.disabled = false;
    stopButton.disabled = true;
}
function mainLoop(currentTime) {
    update(currentTime);
    showScore();
    if (stopAfter < 0 || timeElapsed < stopAfter * fps) {
        animationFrame = requestAnimationFrame(mainLoop);
    }
    else {
        stopMainLoop();
    }
}
function resetScore() {
    nComplete = 0;
    timeElapsed = 0;
    score = 0;
    showScore();
}
function startMainLoop() {
    if (animationFrame === -1) {
        startTime = Date.now();
        resetScore();
        animationFrame = requestAnimationFrame(mainLoop);
    }
    startButton.disabled = true;
    stopButton.disabled = false;
}
nAgents_selector.addEventListener("change", function () {
    let restart = animationFrame !== -1;
    stopMainLoop();
    nAgents = parseInt(nAgents_selector.value);
    initAgents();
    resetScore();
    draw();
    if (restart) {
        startMainLoop();
    }
});
nTasks_selector.addEventListener("change", function () {
    let restart = animationFrame !== -1;
    stopMainLoop();
    nTasks = parseInt(nTasks_selector.value);
    tasks = [];
    initTasks();
    resetScore();
    draw();
    if (restart) {
        startMainLoop();
    }
});
taskCapacity_selector.addEventListener("change", function () {
    let restart = animationFrame !== -1;
    stopMainLoop();
    taskCapacity = parseInt(taskCapacity_selector.value);
    resetScore();
    draw();
    if (restart) {
        startMainLoop();
    }
});
startButton.addEventListener("click", startMainLoop);
stopButton.addEventListener("click", stopMainLoop);
initAgents();
initTasks();
resetScore();
draw();
startButton.disabled = false;
stopButton.disabled = true;
//# sourceMappingURL=main.js.map