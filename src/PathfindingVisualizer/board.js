const gridHTML = document.getElementById("table-grid");
const nav = document.getElementById("nav");
const startBtn = document.getElementById("startButton");
const clearBoard = document.getElementById("clearBoard");
const clearWalls = document.getElementById("clearWalls");
const clearPath = document.getElementById("clearPath");
const clearWeights = document.getElementById("clearWeights");
const nodeType = document.getElementById("nodeType");
const speedDropdown = document.getElementById("speedDropdown");
const selectAlgo = document.getElementById("selectAlgo");

const weights = {sand: 2, water: 5, fire: 10, start: 0, end: 0, wall: Infinity, none: 0};
const speed = {slow: 5, medium: 2, fast: 0.5}

let grid;


class Node{
    constructor(id, status, type){
        this.id = id;
        this.status = status;
        this.type = type;
        this.previousNode = null;
        this.distance = Infinity;
        this.visited = false;
        this.weight = 0;
    }
}

class Grid{
    constructor(height, width){
        this.height = height;
        this.width = width;
        this.start = null;
        this.end = null;
        this.board = [];
        this.nodes = {};
        this.pressedNodeStatus = "none";
        this.lastUpdatedNode = null;
        this.mouseDown = false;
        this.algoDone = true;
        this.currentAlgo = "none";
        this.speed = "medium";
        this.prevNode = null;
        this.prevNodeStatus = "none";
        this.selectedNodeType = "wall";
    }
    createGrid(){
        let tableHTML = "";
        for(let row = 0; row < this.height; row++){
            let currRow = [];
            let rowHTML = `<tr id="row ${row}">`;
            for(let col = 0; col < this.width; col++){
                let idNewNode = `${row}-${col}`;
                let newNode = new Node(idNewNode, "unvisited", "none");
                this.nodes[`${idNewNode}`] = newNode;
                currRow.push(newNode);
                rowHTML += `<td id="${idNewNode}" class="unvisited none"></td>`;
            }
            this.board.push(currRow);
            tableHTML += `${rowHTML}</tr>`
        }
        gridHTML.innerHTML = tableHTML;
    }

    changeNodeType(currNode, newType){
        if(currNode.type !== newType){
            let currHTMLElement = document.getElementById(currNode.id);
            currHTMLElement.classList.add(newType);
            currHTMLElement.classList.remove(`${currNode.type}`);
            currNode.type = newType;
            currNode.weight = weights[`${currNode.type}`];
        }
    }

    changeNodeStatus(currNode, newStatus){
        if(currNode.status !== newStatus){
            let currHTMLElement = document.getElementById(currNode.id);
            currHTMLElement.classList.remove(`${currNode.status}`);
            currHTMLElement.classList.add(newStatus);
            currNode.status = newStatus;
            if(currNode.status === "visited"){
                currNode.visited = true;
            }
            else if(currNode.status === "unvisited"){
                currNode.visited = false;
            }
        }
    }

    changeSpecialNodes = function(node){
        let parGrid = this;
        if(parGrid.prevNode){
            if(node.type !== "start" && node.type !== "end"){
                if(parGrid.pressedNodeStatus === "start"){
                    parGrid.setStart = node.id;
                }
                if(parGrid.pressedNodeStatus === "end"){
                    parGrid.setEnd = node.id;
                }
                node.type = parGrid.pressedNodeStatus;
            }
        }
    }

    changeNormalNodes(node){
        let parGrid = this;
        if(node.type === "start" || node.type === "end"){
            return;
        }
        if(node.type !== parGrid.selectedNodeType){
            parGrid.changeNodeType(node, parGrid.selectedNodeType);
        }
        else{
            parGrid.changeNodeType(node, "none");
        }
    }

    visualizeAlgo(){
        this.algoDone = false;
        this.clearPath();
        let visitedNodesInOrder;
        if(this.currentAlgo === "Dijkstra"){
            visitedNodesInOrder = dijkstra(this);
        }
        else if(this.currentAlgo === "A* Euclidean"){
            visitedNodesInOrder = aStar(this, "euclidean");
        }
        else if(this.currentAlgo === "A* Manhattan"){
            visitedNodesInOrder = aStar(this, "manhattan");
        }
        else if(this.currentAlgo === "Recursive Division"){
            this.algoDone = true;
            recursiveDivision();
            return;
        }
        else{
            this.algoDone = true;
            return;
        }
        const nodesInShortestPathOrder = getNodesInShortestPathOrder(this.end);
        animateAlgo(visitedNodesInOrder, nodesInShortestPathOrder);
    }


    addEventListeners(){
        for(let row = 0; row < this.height; row++){
            for(let col = 0; col < this.width; col++){
                let parGrid = this;
                let currId = `${row}-${col}`;
                let currNode = parGrid.getNode(currId);
                let currHTMLElement = document.getElementById(currId);
                currHTMLElement.addEventListener("mousedown", function (e) {
                    e.preventDefault();
                    if(parGrid.algoDone){
                        parGrid.mouseDown = true;
                        parGrid.pressedNodeStatus = currNode.type;
                        parGrid.prevNode = parGrid.getNode(currId);
                        if(currNode.type !== "end" && currNode.type !== "start"){
                            parGrid.changeNormalNodes(currNode);
                        }
                    }
                });
                currHTMLElement.addEventListener("mouseup", function () {
                    if(parGrid.algoDone) {
                        if (currNode.type === "end" || currNode.type === "start") {
                            if (currNode.type !== parGrid.pressedNodeStatus) {
                                if (parGrid.pressedNodeStatus === "start") {
                                    parGrid.setStart = parGrid.prevNode.id;
                                } else if (parGrid.pressedNodeStatus === "end") {
                                    parGrid.setEnd = parGrid.prevNode.id;
                                }
                            }
                        }
                        parGrid.mouseDown = false;
                        parGrid.pressedNodeStatus = "none";
                        parGrid.prevNode = null;
                        parGrid.prevNodeStatus = "none";
                    }
                });
                currHTMLElement.addEventListener("mouseenter", function (e) {
                    if(parGrid.mouseDown && parGrid.algoDone){
                        parGrid.prevNodeStatus = currNode.type;
                        if(parGrid.pressedNodeStatus !== "end" && parGrid.pressedNodeStatus !== "start"){
                            parGrid.changeNormalNodes(currNode);
                        }
                        else{
                            parGrid.changeSpecialNodes(currNode);
                        }
                    }
                });
                currHTMLElement.addEventListener("mouseleave", function () {
                    if(parGrid.mouseDown && parGrid.algoDone){
                        if(parGrid.pressedNodeStatus === "end" || parGrid.pressedNodeStatus === "start"){
                            parGrid.changeNodeType(currNode, parGrid.prevNodeStatus);
                            currNode.type = parGrid.prevNodeStatus;
                        }
                        parGrid.prevNode = currNode;
                    }
                });
            }
        }
    }

    getNode(id){
        return this.nodes[`${id}`];
    }

    clearPath(){
        let parGrid = this;
        if(parGrid.algoDone) {
            for (let row = 0; row < this.height; row++) {
                for (let col = 0; col < this.width; col++) {
                    let parGrid = this;
                    let currId = `${row}-${col}`;
                    let currNode = parGrid.getNode(currId);
                    parGrid.changeNodeStatus(currNode, "unvisited");
                }
            }
        }
    }

    clearWeights(){
        let parGrid = this;
        if(parGrid.algoDone) {
            const weightNodes = ["sand", "water", "fire"];
            for (let row = 0; row < this.height; row++) {
                for (let col = 0; col < this.width; col++) {
                    let parGrid = this;
                    let currId = `${row}-${col}`;
                    let currNode = parGrid.getNode(currId);
                    if (weightNodes.includes(currNode.type)) {
                        parGrid.changeNodeType(currNode, "none");
                    }
                }
            }
        }
    }

    clearBoard(){
        let parGrid = this;
        if(parGrid.algoDone){
            parGrid.clearWeights();
            parGrid.clearPath();
            parGrid.clearWalls();
        }
    }

    resetNodes(){
        for(let row = 0; row < this.height; row++){
            for(let col = 0; col < this.width; col++) {
                let parGrid = this;
                let currId = `${row}-${col}`;
                let currNode = parGrid.getNode(currId);
                parGrid.changeNodeStatus(currNode, "unvisited");
                currNode.previousNode = null;
                currNode.distance = Infinity;
            }
        }
    }

    clearWalls(){
        for(let row = 0; row < this.height; row++){
            for(let col = 0; col < this.width; col++){
                let parGrid = this;
                let currId = `${row}-${col}`;
                let currNode = parGrid.getNode(currId);
                if(currNode.type === "wall"){
                    parGrid.changeNodeType(currNode, "none");
                }
            }
        }
    }

    set setStart(startId){
        let parGrid = this;
        let splitId = startId.split("-");
        if(splitId[0] >= this.height){
            return;
        }
        if(splitId[1] >= this.width){
            return;
        }
        parGrid.changeNodeType(parGrid.getNode(startId), "start");
        parGrid.start = `${startId}`;
    }

    set setEnd(endId){
        let parGrid = this;
        let splitId = endId.split("-");
        if(splitId[0] >= this.height){
            return;
        }
        if(splitId[1] >= this.width){
            return;
        }
        parGrid.changeNodeType(parGrid.getNode(endId), "end");
        parGrid.end = `${endId}`;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const navHeight = nav.getBoundingClientRect().height;
    const height = Math.max(5, Math.floor((window.innerHeight - navHeight - 42) / 26.5));
    const width = Math.max(10, Math.floor(window.innerWidth / 26.5));
    grid = new Grid(height, width);
    grid.createGrid();
    grid.setEnd = `${Math.floor(grid.height * 3 / 4)}-${Math.floor(grid.width * 3 / 4)}`;
    grid.setStart = `${Math.floor(grid.height / 4)}-${Math.floor(grid.width / 4)}`;
    grid.addEventListeners();
    clearBoard.addEventListener("click", function (e) {
        e.currentTarget.parentElement.classList.remove("show-dropdown");
        grid.clearBoard();
    });
    clearPath.addEventListener("click", function (e) {
        e.currentTarget.parentElement.classList.remove("show-dropdown");
        grid.clearPath();
    });
    clearWeights.addEventListener("click", function (e) {
        e.currentTarget.parentElement.classList.remove("show-dropdown");
        grid.clearWeights();
    });
    clearWalls.addEventListener("click", function (e) {
        e.currentTarget.parentElement.classList.remove("show-dropdown");
        grid.clearWalls();
    });
});

startBtn.addEventListener("click", function () {
    if(grid.algoDone){
        if(grid.currentAlgo === "none"){
            startBtn.innerHTML = "Pick an Algorithm!";
            return;
        }
        grid.resetNodes();
        grid.visualizeAlgo();
    }
});

nodeType.addEventListener("click", function(e){
    let eventEle = e.target;
    if(eventEle.nodeName === "A"){
        eventEle = eventEle.parentElement;
    }
    grid.selectedNodeType = `${eventEle.dataset.id}`;
    eventEle.parentElement.parentElement.children[0].innerHTML = `Node: ${eventEle.dataset.id}`;
});

selectAlgo.addEventListener("click", function (e) {
    let eventEle = e.target;
    if(eventEle.nodeName === "A"){
        eventEle = eventEle.parentElement;
    }
    grid.currentAlgo = `${eventEle.dataset.id}`;
    startBtn.innerHTML = `Visualize ${eventEle.dataset.id}!`;
});

speedDropdown.addEventListener("click", function (e) {
    let eventEle = e.target;
    if(eventEle.nodeName === "A"){
        eventEle = eventEle.parentElement;
    }
    grid.speed = `${eventEle.dataset.id}`;
    eventEle.parentElement.parentElement.children[0].innerHTML = `Speed: ${eventEle.dataset.id}`;
});

function dijkstra (grid){
    let startNode = grid.getNode(grid.start);
    let finishNode = grid.getNode(grid.end);
    const visitedNodesInOrder = [];
    const unvisitedNodes = getAllNodes(grid);
    startNode.distance = 0;
    while(!!unvisitedNodes.length){
        sortNodesByDistance(unvisitedNodes);
        const closestNode = unvisitedNodes.shift();
        if(closestNode.type === "wall") continue;
        if(closestNode.distance === Infinity){
            return visitedNodesInOrder;
        }
        closestNode.visited = true;
        visitedNodesInOrder.push(closestNode);
        if(closestNode === finishNode){
            return visitedNodesInOrder;
        }
        updateUnvisitedNeighbors(closestNode, grid);
    }
}

function getAllNodes(grid){
    const nodes = [];
    for(const row of grid.board){
        for(const node of row){
            nodes.push(node);
        }
    }
    return nodes;
}

function sortNodesByDistance(nodes){
    nodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
}

function getUnvisitedNeighbors(node, grid){
    const neighbors = [];
    const coordinates = node.id.split("-");
    const row = parseInt(coordinates[0]);
    const col = parseInt(coordinates[1]);
    if(row > 0){
        neighbors.push(grid.getNode(`${row - 1}-${col}`));
    }
    if(col > 0){
        neighbors.push(grid.getNode(`${row}-${col - 1}`));
    }
    if(row < grid.height - 1){
        neighbors.push(grid.getNode(`${row + 1}-${col}`));
    }
    if(col < grid.width - 1){
        neighbors.push(grid.getNode(`${row}-${col + 1}`));
    }

    return neighbors.filter(neighbor => !neighbor.visited);
}

function updateUnvisitedNeighbors(node, grid){
    const unvisitedNeighbors = getUnvisitedNeighbors(node, grid);
    for(const neighbor of unvisitedNeighbors){
        neighbor.distance = node.distance + neighbor.weight + 1;
        neighbor.previousNode = node;
    }
}

function getNodesInShortestPathOrder(finishNode){
    const nodesInShortestPathOrder = [];
    let currentNode = grid.getNode(finishNode);
    while (currentNode != null){
        nodesInShortestPathOrder.unshift(currentNode);
        currentNode = currentNode.previousNode;
    }
    return nodesInShortestPathOrder;
}

function animateAlgo(visitedNodesInOrder, nodesInShortestPathOrder){
    startBtn.style.backgroundColor = "red";
    //after entire animation set algoDone to true
    let duration = calculateDijkstraDuration(visitedNodesInOrder, nodesInShortestPathOrder);
    setTimeout(() => {
        grid.algoDone = true;
        startBtn.style.backgroundColor = "limegreen";
    }, duration);
    //visitedNodes animation
    for(let i = 0; i < visitedNodesInOrder.length; i++){
        setTimeout(() => {
            const node = visitedNodesInOrder[i];
            grid.changeNodeStatus(node, "visited");
        }, 10 * i * speed[`${grid.speed}`]);
    }
    //shortestPath animation (if path was found)
    if(nodesInShortestPathOrder.length > 1){
        setTimeout(() => {
            this.animateShortestPath(nodesInShortestPathOrder);
        }, 10 * speed[`${grid.speed}`] * visitedNodesInOrder.length);
    }
}

function animateShortestPath(nodesInShortestPathOrder){
    for(let i = 0; i < nodesInShortestPathOrder.length; i++){
        setTimeout(() => {
            const node = nodesInShortestPathOrder[i];
            grid.changeNodeStatus(node, "shortestPath");
        }, 50 * speed[`${grid.speed}`] * i);
    }
}

function calculateDijkstraDuration(visitedNodesInOrder, nodesInShortestPathOrder){
    let duration = 0;
    duration += visitedNodesInOrder.length * speed[`${grid.speed}`] * 10;
    duration += nodesInShortestPathOrder.length * 50 * speed[`${grid.speed}`];
    return duration;
}
//end of dijkstra

//start of a*

function aStar (grid, distanceMeasure){
    let startNode = grid.getNode(grid.start);
    let finishNode = grid.getNode(grid.end);
    const openList = [];
    const visitedNodesInOrder = [];
    openList.push(grid.getNode(grid.start));
    startNode.distance = 0;
    while(!!openList.length){
        sortNodesAStar(openList, distanceMeasure);
        const currNode = openList.shift();
        visitedNodesInOrder.push(currNode);
        if(currNode.type === "wall") continue;
        if(currNode.distance === Infinity){
            return visitedNodesInOrder;
        }
        currNode.visited = true;
        if(currNode === finishNode){
            return visitedNodesInOrder;
        }
        let toAdd = updateNeighborsAStar(currNode, grid);
        for(const node of toAdd){
            if(!openList.includes(node)){
                openList.push(node);
            }
        }
    }
    return visitedNodesInOrder;
}

//manhattan distance to end node + distance travelled to node
function sortNodesAStar(nodes, distanceMeasure){
    if(distanceMeasure === "euclidean"){
        nodes.sort((nodeA, nodeB) => nodeA.distance + euclDistToEndNode(nodeA) - nodeB.distance - euclDistToEndNode(nodeB));
    }
    else{
        nodes.sort((nodeA, nodeB) => nodeA.distance + manhattanDistToEndNode(nodeA) - nodeB.distance - manhattanDistToEndNode(nodeB));
    }
}

function manhattanDistToEndNode(node){
    let splitEndId = grid.end.split("-");
    let yEnd = splitEndId[0];
    let xEnd = splitEndId[1];
    let splitNodeId = node.id.split("-");
    let yNode = splitNodeId[0];
    let xNode= splitNodeId[1];

    return 1.001*Math.abs(xEnd - xNode) + Math.abs(yEnd - yNode);
}

function euclDistToEndNode(node){
    let splitEndId = grid.end.split("-");
    let yEnd = parseInt(splitEndId[0]);
    let xEnd = parseInt(splitEndId[1]);
    let splitNodeId = node.id.split("-");
    let yNode = parseInt(splitNodeId[0]);
    let xNode= parseInt(splitNodeId[1]);

    return 1.001*(Math.sqrt(Math.pow(xEnd - xNode, 2) + Math.pow(yEnd - yNode, 2)));
}

function updateNeighborsAStar(node, grid) {
    const neighbors = getNeighbors(node, grid);
    const filteredNeighbors = [];
    for(const neighbor of neighbors){
        if(!neighbor.visited){
            neighbor.distance = node.distance + neighbor.weight + 1;
            neighbor.previousNode = node;
            filteredNeighbors.push(neighbor);
        }
        else if(neighbor.distance > node.distance + neighbor.weight + 1){
            neighbor.distance = node.distance + neighbor.weight + 1;
            neighbor.previousNode = node;
            filteredNeighbors.push(neighbor);
        }
    }
    return filteredNeighbors;
}

function getNeighbors(node, grid){
    const neighbors = [];
    const coordinates = node.id.split("-");
    const row = parseInt(coordinates[0]);
    const col = parseInt(coordinates[1]);
    if(row > 0){
        neighbors.push(grid.getNode(`${row - 1}-${col}`));
    }
    if(col > 0){
        neighbors.push(grid.getNode(`${row}-${col - 1}`));
    }
    if(row < grid.height - 1){
        neighbors.push(grid.getNode(`${row + 1}-${col}`));
    }
    if(col < grid.width - 1){
        neighbors.push(grid.getNode(`${row}-${col + 1}`));
    }

    return neighbors;
}

function recursiveDivision(){
    grid.resetNodes();
    grid.clearBoard();

    if(grid.height % 2 === 1){
        if(grid.width % 2 === 1){
            divide(grid.width, grid.height, 0, 0);
        }
        else{
            buildVerticalLine(0, grid.height - 1, grid.width - 1);
            divide(grid.width - 1, grid.height, 0, 0);
        }
    }
    else{
        if(grid.width % 2 === 1){
            buildHorizontalLine(0, grid.width - 1, grid.height - 1);
            divide(grid.width, grid.height - 1, 0, 0);
        }
        else{
            buildHorizontalLine(0, grid.width - 1, grid.height - 1);
            buildVerticalLine(0, grid.height - 1, grid.width - 1);
            divide(grid.width - 1, grid.height - 1, 0, 0);
        }
    }
}

function divide(width, height, offSetX, offSetY) {
    let possible;
    if (width < 2 || height < 2){
        return;
    }
    let orientation, pathIdx, wallIdx;
    if(width > height){
        orientation = "vertical";
    }
    else if(height > width){
        orientation = "horizontal";
    }
    else{
        orientation = Math.floor(Math.random()*2) === 0 ? "vertical" : "horizontal";
    }
    possible = returnPossiblePathAndWall(orientation, width, height, offSetX, offSetY);
    if(possible.length === 0){
        if(width === 3 && height === 3){
            orientation = orientation === "vertical" ? "horizontal" : "vertical";
            possible = returnPossiblePathAndWall(orientation, width, height, offSetX, offSetY);
            if(possible.length === 0){
                return;
            }
        }
        else{
            return;
        }
    }
    let randomIndex = Math.floor(Math.random() * possible.length);
    pathIdx = possible[randomIndex][0];
    wallIdx = possible[randomIndex][1];
    if(orientation === "horizontal"){
        buildWall(wallIdx, pathIdx, "horizontal", height, width, offSetX, offSetY);
        divide(width, wallIdx - offSetY, offSetX, offSetY);
        divide(width, height - wallIdx + offSetY - 1, offSetX, wallIdx + 1);
    }
    else{
        buildWall(wallIdx, pathIdx, "vertical", height, width, offSetX, offSetY);
        divide(wallIdx - offSetX, height, offSetX, offSetY);
        divide(width - wallIdx + offSetX - 1, height, wallIdx + 1, offSetY);
    }
}

function outOfBounce(x, y) {
    if(grid.height <= y || grid.width <= x || x < 0 || y < 0){
        return true;
    }
    return false;
}

function isWall(x, y){
    if(grid.getNode(`${parseInt(y)}-${parseInt(x)}`).type === "wall"){
        return true;
    }
    return false;
}

function buildWall(wallIdx, pathIdx, orientation, height, width, offsetX, offsetY){
    if(orientation === "horizontal"){
        for(let i = 0; i < width; i++){
            let currNode = grid.getNode(`${parseInt(wallIdx)}-${i + parseInt(offsetX)}`);
            if(currNode.type !== "start" && currNode.type !== "end"){
                if(i !== pathIdx){
                    grid.changeNodeType(currNode, "wall");
                }
            }
        }
    }
    else{
        for(let i = 0; i < height; i++){
            let currNode = grid.getNode(`${i + parseInt(offsetY)}-${parseInt(wallIdx)}`);
            if(currNode.type !== "start" && currNode.type !== "end"){
                if(i !== pathIdx){
                    grid.changeNodeType(currNode, "wall");
                }
            }
        }
    }
}

function buildVerticalLine(startY, endY, x){
    for(let i = 0; i <= (endY - startY); i++){
        let currNode = grid.getNode(`${i + parseInt(startY)}-${parseInt(x)}`);
        if(currNode.type !== "start" && currNode.type !== "end"){
            grid.changeNodeType(currNode, "wall");
        }
    }
}

function buildHorizontalLine(startX, endX, y){
    for(let i = 0; i <= (endX - startX); i++){
        let currNode = grid.getNode(`${parseInt(y)}-${i + parseInt(startX)}`);
        if(currNode.type !== "start" && currNode.type !== "end"){
            grid.changeNodeType(currNode, "wall");
        }
    }
}

// return [pathId, wallId]
function returnPossiblePathAndWall(orientation, width, height, offsetX, offsetY){
    let possible = [];
    if(orientation === "horizontal"){
        for(let i = 1; i < height - 1; i++){
            let x = parseInt(offsetX);
            let y = parseInt(offsetY) + i;
            //left side check
            if(outOfBounce(x - 1, y) || isWall(x - 1, y)){
                if(outOfBounce(x + width, y) || isWall(x + width, y)){
                    for(let j = offsetX; j < offsetX + width; j++){
                        possible.push([j - offsetX,y]);
                    }
                }
                else{
                    possible.push([x + width - 1 - offsetX,y]);
                }
            }
            else{
                if(outOfBounce(x + width, y) || isWall(x + width, y)){
                    possible.push([x - offsetX,y]);
                }
            }
        }
    }
    else{
        for(let i = 1; i < width - 1; i++){
            let x = parseInt(offsetX) + i;
            let y = parseInt(offsetY);
            //left side check
            if(outOfBounce(x, y - 1) || isWall(x, y - 1)){
                if(outOfBounce(x, y + height) || isWall(x, y + height)){
                    for(let j = offsetY; j < offsetY + height; j++){
                        possible.push([j - offsetY,x]);
                    }
                }
                else{
                    possible.push([y + height - 1 - offsetY, x]);
                }
            }
            else{
                if(outOfBounce(x, y + height) || isWall(x, y + height)){
                    possible.push([y - offsetY,x]);
                }
            }
        }
    }
    return possible.filter(array => array[1] % 2);
}