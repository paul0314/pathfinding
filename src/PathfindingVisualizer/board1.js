class Node{
    constructor(id, status, type){
        this.id = id;
        this.status = status;
        this.type = type;
    }
}

class Grid{
    constructor(height, width){
        this.height = height;
        this.width = width;
        this.nodes = {};
        this.initializeEmptyBoard();
        this.start = null;
        this.end = null;
    }
    initializeEmptyBoard(){
        for(let row = 0; row < this.height; row++){
            for(let col = 0; col < this.width; col++){
                let idNewNode = `${row}-${col}`;
                this.nodes[`${idNewNode}`] = new Node(idNewNode, "unvisited", "none");
            }
        }
    }
    setStart(startId){
        let parGrid = this;
        let splitId = startId.split("-");
        if(splitId[0] >= this.height){
            return;
        }
        if(splitId[1] >= this.width){
            return;
        }
        parGrid.changeNodeType(startId, "start");
        parGrid.start = `${startId}`;

    }

    setEnd(endId){
        let parGrid = this;
        let splitId = endId.split("-");
        if(splitId[0] >= this.height){
            return;
        }
        if(splitId[1] >= this.width){
            return;
        }
        parGrid.changeNodeType(endId, "end");
        parGrid.end = `${endId}`;
    }

    changeNodeType(currNodeId, newType){
        let parGrid = this;
        let currNode = parGrid.getNode(currNodeId);
        if(currNode.type !== newType){
            currNode.type = newType;
        }
    }
    changeNodeStatus(currNodeId, newStatus){
        let parGrid = this;
        let currNode = parGrid.getNode(currNodeId);
        if(currNode.status !== newStatus){
            currNode.status = newStatus;
        }
    }
    getNode(nodeId){
        return this.nodes[`${nodeId}`];
    }
    getStatus(nodeId){
        return this.nodes[`${nodeId}`].status;
    }
    getType(nodeId){
        return this.nodes[`${nodeId}`].type;
    }
}

class Model{
    constructor() {
        this.grid = null;
        this.start = null;
        this.end = null;
    }
    commitNodeStatusChange(nodeId, oldStatus, newStatus){
        this.onNodeStatusChange(nodeId, oldStatus, newStatus);
    }
    commitNodeTypeChange(nodeId, oldType, newType){
        this.onNodeTypeChange(nodeId, oldType, newType);
    }
    setNodeStatus(nodeId, newNodeStatus){
        let oldStatus = this.grid.getStatus(nodeId);
        if(oldStatus !== newNodeStatus){
            this.grid.changeNodeStatus(nodeId, newNodeStatus);
            this.commitNodeStatusChange(nodeId, oldStatus, newNodeStatus);
        }
    }
    setNodeType(nodeId, newNodeType){
        let oldStatus = this.grid.getType(nodeId);
        if(oldStatus !== newNodeType){
            if(newNodeType === "start"){
                this.start = `${nodeId}`;
            }
            else if(newNodeType === "end"){
                this.end = `${nodeId}`;
            }
            this.grid.changeNodeType(nodeId, newNodeType);
            this.commitNodeTypeChange(nodeId, oldStatus, newNodeType);
        }
    }
    getNode(nodeId){
        return this.grid.nodes[nodeId];
    }
    setStart(newStartId){
        let oldStartType = this.grid.getType(newStartId);
        this.grid.changeNodeType(newStartId, "start");
        this.start = `${newStartId}`;
        this.commitNodeTypeChange(newStartId, oldStartType, "start");
    }
    setEnd(newEndId){
        let oldEndType = this.grid.getType(newEndId);
        this.grid.changeNodeType(newEndId, "end");
        this.end = `${newEndId}`;
        this.commitNodeTypeChange(newEndId, oldEndType, "end");
    }
    bindNodeStatusChanged(callback){
        this.onNodeStatusChange = callback;
    }
    bindNodeTypeChanged(callback){
        this.onNodeTypeChange = callback;
    }
    initialize(height, width){
        this.grid = new Grid(height, width);
    }
}

class Controller{
    constructor(model){
        let parController = this;
        this.model = model;
        this.view = new View(parController, model);

        this.weightNodes = ["sand", "water", "fire"];
        this.weights = {sand: 2, water: 5, fire: 10, start: 0, end: 0, wall: Infinity, none: 0};
        this.speed = {slow: 5, medium: 2, fast: 0.5}

        this.algoDone = true;
        this.currSpeed = "medium";
        this.selectedNodeType = "wall";
        this.mouseDown = false;
        this.pressedNodeType = "none";
        this.prevNode = null;
        this.prevNodeType = "none";

        let boardSize = this.view.calculateWidthAndHeight();
        let startEndIds = this.calculateInitialStartEnd(boardSize[0], boardSize[1]);
        this.model.initialize(boardSize[0], boardSize[1]);
        this.onReload(this.model.grid);
        this.model.bindNodeTypeChanged(this.onNodeTypeChanged);
        this.model.bindNodeStatusChanged(this.onNodeStatusChanged);
        this.model.setNodeType(startEndIds[0], "start");
        this.model.setNodeType(startEndIds[1], "end");
        this.view.bindClearBoard(this.handleClearBoard);
        this.view.bindClearWalls(this.handleClearWalls);
        this.view.bindClearWeights(this.handleClearWeights);
        this.view.bindClearPath(this.handleClearPath);
        this.view.bindSetSpeed(this.handleSpeedSelected);
        this.view.bindSelectedNodeType(this.handleNodeTypeSelected);
        this.view.bindSetAlgo(this.handleAlgoSelected);
        this.view.bindVisualize(this.handleVisualize);
    }
    onNodeTypeChanged = (nodeId, oldType, newType) => {
        this.view.displayChangedNodeType(nodeId, oldType, newType);
    }
    onNodeStatusChanged = (nodeId, oldType, newType) => {
        this.view.displayChangedNodeStatus(nodeId, oldType, newType);
    }
    onReload = grid => {
        this.view.displayGrid(grid);
        this.view.setupDropdowns();
        this.view.bindMouseEnter(this.handleMouseEnter);
        this.view.bindMouseUp(this.handleMouseUp);
        this.view.bindMouseDown(this.handleMouseDown);
        this.view.bindMouseLeave(this.handleMouseLeave);
    }
    handleVisualize = (eventEle) =>{
        let deepGridCopy = this.deepCopyGrid(this.model.grid);
    }
    handleClearWalls = () =>{
        this.clearWalls();
    }
    clearWalls(){
        for(let row = 0; row < this.model.grid.height; row++){
            for(let col = 0; col < this.model.grid.width; col++){
                let currId = `${row}-${col}`;
                let currNode = this.model.grid.getNode(currId);
                if(currNode.type === "wall"){
                    this.model.setNodeType(currId, "none");
                }
            }
        }
    }
    handleClearWeights = () =>{
        if(this.algoDone){
            this.clearWeights();
        }
    }
    clearWeights(){
        for(let row = 0; row < this.model.grid.height; row++){
            for(let col = 0; col < this.model.grid.width; col++){
                let currId = `${row}-${col}`;
                let currNode = this.model.grid.getNode(currId);
                if (this.weightNodes.includes(currNode.type)) {
                    this.model.setNodeType(currId, "none");
                }
            }
        }
    }
    handleClearPath = () =>{
        if(this.algoDone){
            this.clearWalls();
        }
    }
    clearPath(){
        for(let row = 0; row < this.model.grid.height; row++){
            for(let col = 0; col < this.model.grid.width; col++){
                let currId = `${row}-${col}`;
                this.model.setNodeStatus(currId, "unvisited");
            }
        }
    }
    handleClearBoard = () =>{
        if(this.algoDone){
            this.clearWalls();
            this.clearWeights();
            this.clearPath();
        }
    }
    handleSpeedSelected = (eventEle) =>{
        if(this.algoDone){
            this.currSpeed = `${eventEle.dataset.id}`;
            eventEle.parentElement.parentElement.children[0].innerHTML = `Speed: ${eventEle.dataset.id}`;
        }
    }
    handleNodeTypeSelected = (eventEle) =>{
        if(this.algoDone){
            this.selectedNodeType = `${eventEle.dataset.id}`;
            eventEle.parentElement.parentElement.children[0].innerHTML = `Speed: ${eventEle.dataset.id}`;
        }
    }
    handleAlgoSelected = (eventEle) =>{
        if(this.algoDone){

        }
    }
    handleMouseDown = (nodeId) => {
        if(this.algoDone){
            this.mouseDown = true;
            let currNode = this.model.getNode(nodeId);
            this.pressedNodeType = currNode.type;
            this.prevNode = this.model.getNode(nodeId);
            if(currNode.type !== "end" && currNode.type !== "start"){
                this.changeNormalNode(currNode);
            }
        }
    }
    handleMouseUp = (nodeId) => {
        if(this.algoDone){
            let currNode = this.model.getNode(nodeId);
            if (currNode.type === "end" || currNode.type === "start") {
                if (currNode.type !== this.pressedNodeType) {
                    if (this.pressedNodeType === "start") {
                        this.model.setStart(this.prevNode.id);
                    } else if (this.pressedNodeType === "end") {
                        this.model.setEnd(this.prevNode.id);
                    }
                }
            }
            this.mouseDown = false;
            this.pressedNodeType = "none";
            this.prevNode = null;
            this.prevNodeType = "none";
        }
    }
    handleMouseEnter = (nodeId) => {
        if(this.algoDone && this.mouseDown){
            let currNode = this.model.getNode(nodeId);
            this.prevNodeType = currNode.type;
            if(this.pressedNodeType !== "end" && this.pressedNodeType !== "start"){
                this.changeNormalNode(currNode);
            }
            else{
                this.changeSpecialNode(currNode);
            }
        }
    }
    handleMouseLeave = (nodeId) => {
        if(this.algoDone && this.mouseDown){
            let currNode = this.model.getNode(nodeId);
            if(this.pressedNodeType === "end" || this.pressedNodeType === "start"){
                this.model.setNodeType(currNode.id, this.prevNodeType);
            }
            this.prevNode = currNode;
        }
    }
    changeNormalNode(node){
        if(node.type === "start" || node.type === "end"){
            return;
        }
        if(node.type !== this.selectedNodeType){
            this.model.setNodeType(node.id, this.selectedNodeType);
        }
        else{
            this.model.setNodeType(node.id, "none");
        }
    }
    changeSpecialNode(node){
        if(this.prevNode){
            if(node.type !== "start" && node.type !== "end"){
                if(this.pressedNodeType === "start"){
                    this.model.setStart(node.id);
                }
                if(this.pressedNodeType === "end"){
                    this.model.setEnd(node.id);
                }
                node.type = this.pressedNodeType;
            }
        }
    }
    calculateInitialStartEnd(height, width){
        let startId = `${Math.floor(height * 3 / 4)}-${Math.floor(width * 3 / 4)}`;
        let endId = `${Math.floor(height / 4)}-${Math.floor(width / 4)}`;
        return [startId, endId];
    }
}

class View{
    constructor(controller, model) {
        this.startBtn = this.getElement("startButton");
        this.clearBoard = this.getElement("clearBoard");
        this.clearWalls = this.getElement("clearWalls");
        this.clearPath = this.getElement("clearPath");
        this.clearWeights = this.getElement("clearWeights");
        this.nodeType = this.getElement("nodeType");
        this.speedDropdown = this.getElement("speedDropdown");
        this.selectAlgo = this.getElement("selectAlgo");
        this.height = 0;
        this.width = 0;
    }

    bindClearBoard(handler){
        this.clearBoard.addEventListener("click", event => {
            let eventEle = event.currentTarget;
            handler(eventEle);
        });
    }
    bindClearWalls(handler){
        this.clearWalls.addEventListener("click", event => {
            handler();
        });
    }
    bindClearPath(handler){
        this.clearPath.addEventListener("click", event => {
            handler();
        });
    }
    bindClearWeights(handler){
        this.clearWeights.addEventListener("click", event => {
            handler();
        });
    }
    bindSetSpeed(handler){
        this.speedDropdown.addEventListener("click", event => {
            let eventEle = event.target;
            if(eventEle.nodeName === "A"){
                eventEle = eventEle.parentElement;
            }
            handler(eventEle);
        });
    }
    bindSelectedNodeType(handler){
        this.nodeType.addEventListener("click", event => {
            let eventEle = event.target;
            if(eventEle.nodeName === "A"){
                eventEle = eventEle.parentElement;
            }
            handler(eventEle);
        });
    }
    bindSetAlgo(handler){
        this.selectAlgo.addEventListener("click", event => {
            let eventEle = event.target;
            if(eventEle.nodeName === "A"){
                eventEle = eventEle.parentElement;
            }
            handler(eventEle);
        });
    }
    bindVisualize(handler){
        this.startBtn.addEventListener("click", event => {
            handler();
        });
    }
    bindMouseDown(handler){
        for(let row = 0; row < this.height; row++){
            for(let col = 0; col < this.width; col++){
                let currId = `${row}-${col}`;
                let currHTMLElement = document.getElementById(currId);
                currHTMLElement.addEventListener("mousedown", event => {
                    event.preventDefault();
                    handler(currId);
                });
            }
        }
    }
    bindMouseUp(handler){
        this.bindMouseEvent(handler, "mouseup");
    }
    bindMouseEnter(handler){
        this.bindMouseEvent(handler, "mouseenter");
    }
    bindMouseLeave(handler){
        this.bindMouseEvent(handler, "mouseleave");
    }
    bindMouseEvent(handler, type){
        for(let row = 0; row < this.height; row++){
            for(let col = 0; col < this.width; col++){
                let currId = `${row}-${col}`;
                let currHTMLElement = document.getElementById(currId);
                currHTMLElement.addEventListener(type, event => {
                    handler(currId);
                });
            }
        }
    }
    calculateWidthAndHeight(){
        let nav = this.getElement("nav");
        const navHeight = nav.getBoundingClientRect().height;
        const height = Math.max(5, Math.floor((window.innerHeight - navHeight - 42) / 26.5));
        const width = Math.max(10, Math.floor(window.innerWidth / 26.5));
        return [height, width];
    }
    displayGrid(grid){
        let tableGrid = this.getElement("table-grid");
        this.height = grid.height;
        this.width = grid.width;
            let tableHTML = "";
        for(let row = 0; row < this.height; row++){
            let rowHTML = `<tr id="row ${row}">`;
            for(let col = 0; col < this.width; col++){
                let idNewNode = `${row}-${col}`;
                let newNode = grid.getNode(idNewNode);
                rowHTML += `<td id="${idNewNode}" class="${newNode.status} ${newNode.type}"></td>`;
            }
            tableHTML += `${rowHTML}</tr>`
        }
        tableGrid.innerHTML = tableHTML;
    }
    displayChangedNodeStatus(nodeId, oldStatus, newStatus){
        let currHTMLElement = this.getElement(nodeId);
        currHTMLElement.classList.add(newStatus);
        currHTMLElement.classList.remove(oldStatus);
    }
    displayChangedNodeType(nodeId, oldType, newType){
        let currHTMLElement = this.getElement(nodeId);
        currHTMLElement.classList.remove(oldType);
        currHTMLElement.classList.add(newType);
    }
    getElement(selector){
        return document.getElementById(selector);
    }
    getAllElements(selector){
        return document.querySelectorAll(selector);
    }
    setupDropdowns(){
        const dropdownBtns = this.getAllElements(".dropdown-toggle");
        const dropdownContent = this.getAllElements(".dropdown-content");

        dropdownBtns.forEach(function (item) {
            item.addEventListener("click", function (e) {
                const parent = e.currentTarget.parentElement;
                const content = parent.querySelector(".dropdown-content");
                dropdownContent.forEach(function (contents) {
                    if(contents !== content){
                        contents.classList.remove("show-dropdown");
                    }
                });
                content.classList.toggle("show-dropdown");
                if(content.parentElement.style.backgroundColor === "limegreen"){
                    content.parentElement.style.backgroundColor = "darkblue";
                }
                else {
                    content.parentElement.style.backgroundColor = "limegreen";
                }
            });
        });

        document.addEventListener("click", function (clicked) {
            dropdownBtns.forEach(function (item) {
                const parent = item.parentElement;
                const content = parent.querySelector(".dropdown-content");
                if(clicked.target !== item){
                    content.classList.remove("show-dropdown");
                    content.parentElement.style.backgroundColor = "darkblue";
                }
            });
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    let model = new Model();
    let controller = new Controller(model);
});

//helper functions

function setupNodes(grid){
    let weights = {sand: 2, water: 5, fire: 10, start: 0, end: 0, wall: Infinity, none: 0};
    for(let row = 0; row < grid.height; row++){
        for(let col = 0; col < grid.width; col++) {
            let currId = `${row}-${col}`;
            let currNode = grid.getNode(currId);
            currNode.status = "unvisited";
            currNode.previousNode = null;
            currNode.distance = Infinity;
            currNode.visited = false;
            currNode.weight = weights[currNode.type];
        }
    }
}

function deepCopyGrid(grid){
    let newGrid = new Grid(grid.height, grid.width);
    for(let row = 0; row < grid.height; row++){
        for(let col = 0; col < grid.width; col++){
            let currId = `${row}-${col}`;
            newGrid.setNodeStatus(currId, grid.getStatus(currId));
            newGrid.setNodeType(currId, grid.getType(currId));
        }
    }
    newGrid.setStart(grid.start);
    newGrid.setEnd(grid.end);
    return newGrid;
}

function getAllNodes(grid){
    let nodes = [];
    for(let row = 0; row < grid.height; row++){
        for(let col = 0; col < grid.width; col++) {
            let currId = `${row}-${col}`;
            let currNode = grid.getNode(currId);
            nodes.push(currNode);
        }
    }
    return nodes;
}





let Algo = function(){
    this.algo = "";
};

Algo.prototype = {
    setStrategy: function(algo){
        this.algo = algo;
    },
    calculateVisitedNodesInOrder: function(grid){
        return this.algo.calculateVisitedNodesInOrder(grid);
    },
    getNodesInShortestPathOrder: function(grid){
        const nodesInShortestPathOrder = [];
        let currentNode = grid.getNode(grid.end);
        while (currentNode != null){
            nodesInShortestPathOrder.unshift(currentNode);
            currentNode = currentNode.previousNode;
        }
        return nodesInShortestPathOrder;
    }
};

let dijkstra = function(){
    this.calculateVisitedNodesInOrder = function(paramGrid){
        let grid = deepCopyGrid(paramGrid);
        setupNodes(grid);
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


let aStarManhattan = function(){
    this.calculateVisitedNodesInOrder = function (paramGrid) {
        let grid = deepCopyGrid(paramGrid);
        setupNodes(grid);
        let startNode = grid.getNode(grid.start);
        let finishNode = grid.getNode(grid.end);
        const openList = [];
        const visitedNodesInOrder = [];
        openList.push(grid.getNode(grid.start));
        startNode.distance = 0;
        while (!!openList.length) {
            sortNodesAStar(openList, "manhattan");
            const currNode = openList.shift();
            visitedNodesInOrder.push(currNode);
            if (currNode.type === "wall") continue;
            if (currNode.distance === Infinity) {
                return visitedNodesInOrder;
            }
            currNode.visited = true;
            if (currNode === finishNode) {
                return visitedNodesInOrder;
            }
            let toAdd = updateNeighborsAStar(currNode, grid);
            for (const node of toAdd) {
                if (!openList.includes(node)) {
                    openList.push(node);
                }
            }
        }
        return visitedNodesInOrder;
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

let aStarEuclidean = function(){
    this.calculateVisitedNodesInOrder = function (paramGrid) {
        let grid = deepCopyGrid(paramGrid);
        setupNodes(grid);
        let startNode = grid.getNode(grid.start);
        let finishNode = grid.getNode(grid.end);
        const openList = [];
        const visitedNodesInOrder = [];
        openList.push(grid.getNode(grid.start));
        startNode.distance = 0;
        while (!!openList.length) {
            sortNodesAStar(openList, "euclidean");
            const currNode = openList.shift();
            visitedNodesInOrder.push(currNode);
            if (currNode.type === "wall") continue;
            if (currNode.distance === Infinity) {
                return visitedNodesInOrder;
            }
            currNode.visited = true;
            if (currNode === finishNode) {
                return visitedNodesInOrder;
            }
            let toAdd = updateNeighborsAStar(currNode, grid);
            for (const node of toAdd) {
                if (!openList.includes(node)) {
                    openList.push(node);
                }
            }
        }
        return visitedNodesInOrder;
    }
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

function sortNodesAStar(nodes, distanceMeasure){
    if(distanceMeasure === "euclidean"){
        nodes.sort((nodeA, nodeB) => nodeA.distance + euclDistToEndNode(nodeA) - nodeB.distance - euclDistToEndNode(nodeB));
    }
    else{
        nodes.sort((nodeA, nodeB) => nodeA.distance + manhattanDistToEndNode(nodeA) - nodeB.distance - manhattanDistToEndNode(nodeB));
    }
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