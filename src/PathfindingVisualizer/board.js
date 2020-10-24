const gridHTML = document.getElementById("table-grid");
const nav = document.getElementById("nav");
const startBtn = document.getElementById("startButtonLI");
const clearBoard = document.getElementById("clearBoard");
const clearWalls = document.getElementById("clearWalls");
const clearPath = document.getElementById("clearPath");
const clearWeights = document.getElementById("clearWeights");
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
        this.keyDown = false;
        this.algoDone = false;
        this.currentAlgo = null;
        this.speed = "fast";
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
            /*else{
                if(parGrid.pressedNodeStatus === "start"){
                    parGrid.setStart = parGrid.prevNode.id;
                }
                else if(parGrid.pressedNodeStatus === "end"){
                    parGrid.setEnd = parGrid.prevNode.id;
                }
            }*/
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


    visualizeDijkstra(){
        this.clearPath();
        const visitedNodesInOrder = dijkstra(this);
        const nodesInShortestPathOrder = getNodesInShortestPathOrder(this.end);
        animateDijkstra(visitedNodesInOrder, nodesInShortestPathOrder);
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
                    parGrid.mouseDown = true;
                    parGrid.pressedNodeStatus = currNode.type;
                    parGrid.prevNode = parGrid.getNode(currId);
                    if(currNode.type !== "end" && currNode.type !== "start"){
                        parGrid.changeNormalNodes(currNode);
                    }
                });
                currHTMLElement.addEventListener("mouseup", function () {
                    parGrid.mouseDown = false;
                    parGrid.pressedNodeStatus = "none";
                    parGrid.prevNode = null;
                    parGrid.prevNodeStatus = "none";
                });
                currHTMLElement.addEventListener("mouseenter", function (e) {
                    if(parGrid.mouseDown){
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
                    if(parGrid.mouseDown){
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
        for(let row = 0; row < this.height; row++){
            for(let col = 0; col < this.width; col++){
                let parGrid = this;
                let currId = `${row}-${col}`;
                let currNode = parGrid.getNode(currId);
                parGrid.changeNodeStatus(currNode, "unvisited");
            }
        }
    }

    clearWeights(){}

    clearBoard(){
        let parGrid = this;
        parGrid.clearWeights();
        parGrid.clearPath();
        parGrid.clearWalls();
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
    grid.resetNodes();
    grid.visualizeDijkstra();
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
        neighbor.distance = node.distance + 1;
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

//ab 0 beinhaltet Startknoten
function animateDijkstra(visitedNodesInOrder, nodesInShortestPathOrder){
    for(let i = 1; i < visitedNodesInOrder.length - 1; i++){

        setTimeout(() => {
            const node = visitedNodesInOrder[i];
            grid.changeNodeStatus(node, "visited");
        }, 10 * i);
    }
    setTimeout(() => {
        this.animateShortestPath(nodesInShortestPathOrder);
    }, 10 * visitedNodesInOrder.length);
}

function animateShortestPath(nodesInShortestPathOrder){
    for(let i = 1; i < nodesInShortestPathOrder.length - 1; i++){
        setTimeout(() => {
            const node = nodesInShortestPathOrder[i];
            grid.changeNodeStatus(node, "shortestPath");
        }, 50 * i);
    }
}

//end of dijkstra