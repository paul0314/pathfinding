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
    }

    initialize(height, width){
        this.grid = new Grid(height, width);
    }

    setNodeStatus(nodeId, newNodeStatus){
        let oldStatus = this.grid.getStatus(nodeId);
        if(oldStatus !== newNodeStatus){
            this.grid.changeNodeStatus(nodeId, newNodeStatus);
            this.commitNodeStatusChange(nodeId, oldStatus, newNodeStatus);
        }
    }

    commitNodeStatusChange(nodeId, oldStatus, newStatus){
        this.onNodeStatusChange(nodeId, oldStatus, newStatus);
    }

    setNodeType(nodeId, newNodeType){
        let oldStatus = this.grid.getType(nodeId);
        if(oldStatus !== newNodeType){
            if(newNodeType === "start"){
                this.grid.start = `${nodeId}`;
            }
            else if(newNodeType === "end"){
                this.grid.end = `${nodeId}`;
            }
            this.grid.changeNodeType(nodeId, newNodeType);
            this.commitNodeTypeChange(nodeId, oldStatus, newNodeType);
        }
    }

    commitNodeTypeChange(nodeId, oldType, newType){
        this.onNodeTypeChange(nodeId, oldType, newType);
    }

    setStart(newStartId){
        let oldStartType = this.grid.getType(newStartId);
        this.grid.changeNodeType(newStartId, "start");
        this.grid.start = `${newStartId}`;
        this.commitNodeTypeChange(newStartId, oldStartType, "start");
    }

    setEnd(newEndId){
        let oldEndType = this.grid.getType(newEndId);
        this.grid.changeNodeType(newEndId, "end");
        this.grid.end = `${newEndId}`;
        this.commitNodeTypeChange(newEndId, oldEndType, "end");
    }

    bindNodeStatusChanged(callback){
        this.onNodeStatusChange = callback;
    }

    bindNodeTypeChanged(callback){
        this.onNodeTypeChange = callback;
    }

    getNode(nodeId){
        return this.grid.nodes[nodeId];
    }
}

class Controller{
    constructor(model){
        this.model = model;
        this.view = new View(this, model);

        this.weightNodes = ["sand", "water", "fire"];
        this.speeds = {slow: 5, medium: 2, fast: 0.5};

        this.algoDone = true;
        this.currSpeed = "fast";
        this.selectedNodeType = "wall";
        this.mouseDown = false;
        this.pressedNodeType = "none";
        this.prevNode = null;
        this.prevNodeType = "none";

        this.Algo = new Algo();
        this.algoStrategy = null;

        this.setup();
    }

    setup = () => {
        //order important
        this.initModelBinds();
        this.setUpBoard();
        this.initViewBinds();
    }

    setUpBoard(){
        let boardSize = this.view.calculateWidthAndHeight();
        let startEndIds = this.calculateInitialStartEnd(boardSize[0], boardSize[1]);
        this.model.initialize(boardSize[0], boardSize[1]);
        this.onReload(this.model.grid);
        this.model.setNodeType(startEndIds[0], "start");
        this.model.setNodeType(startEndIds[1], "end");
    }

    onReload = grid => {
        this.view.displayGrid(grid);
        this.view.setupTutorial();
        this.view.setupDropdowns();
    }

    initModelBinds(){
        this.model.bindNodeTypeChanged(this.onNodeTypeChanged);
        this.model.bindNodeStatusChanged(this.onNodeStatusChanged);
    }

    initViewBinds(){
        this.view.bindClearBoard(this.handleClearBoard);
        this.view.bindClearWalls(this.handleClearWalls);
        this.view.bindClearWeights(this.handleClearWeights);
        this.view.bindClearPath(this.handleClearPath);
        this.view.bindSetSpeed(this.handleSpeedSelected);
        this.view.bindSelectedNodeType(this.handleNodeTypeSelected);
        this.view.bindSetAlgo(this.handleAlgoSelected);
        this.view.bindVisualize(this.handleVisualize);
        this.view.bindVisualizeMaze(this.handleMazeSelected);
        this.view.bindRefresh(this.handleRefresh);
        this.view.bindMouseEnter(this.handleMouseEnter);
        this.view.bindMouseUp(this.handleMouseUp);
        this.view.bindMouseDown(this.handleMouseDown);
        this.view.bindMouseLeave(this.handleMouseLeave);
    }

    onNodeTypeChanged = (nodeId, oldType, newType) => {
        this.view.displayChangedNodeType(nodeId, oldType, newType);
    }

    onNodeStatusChanged = (nodeId, oldType, newType) => {
        this.view.displayChangedNodeStatus(nodeId, oldType, newType);
    }

    handleRefresh(){
        location.reload();
    }

    handleVisualize = () =>{
        if(this.algoDone){
            this.algoDone = false;
            if (this.algoStrategy !== null){
                let visitedAndPathNodes = this.Algo.calculateVisitedNodesAndPathInOrder(this.model.grid);
                let visitedNodesInOrder = visitedAndPathNodes[0];
                let pathNodesInOrder = visitedAndPathNodes[1];
                this.clearPath();
                this.animateAlgo(visitedNodesInOrder, pathNodesInOrder);
                //algoDone wird in animateAlgo auf true gesetzt
            }
            else{
                this.algoDone = true;
                let startBtn = this.view.getElement("startButton");
                startBtn.innerHTML = `Pick an Algorithm!`;
            }
        }
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
            this.clearPath();
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
            this.clearBoard();
        }
    }

    clearBoard(){
        this.clearWalls();
        this.clearWeights();
        this.clearPath();
    }

    handleSpeedSelected = (eventEle) =>{
        if(this.algoDone){
            this.currSpeed = `${eventEle.dataset.id}`;
            eventEle.parentElement.parentElement.children[0].innerHTML = `Speed: ${eventEle.dataset.id} <span class="carel">▼</span>`;
        }
    }

    handleNodeTypeSelected = (eventEle) =>{
        if(this.algoDone){
            this.selectedNodeType = `${eventEle.dataset.id}`;
            eventEle.parentElement.parentElement.children[0].innerHTML = `Node: ${eventEle.dataset.id} <span class="carel">▼</span>`;
        }
    }

    handleAlgoSelected = (eventEle) =>{
        if(this.algoDone){
            let eventId = eventEle.dataset.id;
            switch(eventId){
                case "Dijkstra":
                    this.algoStrategy = new dijkstra();
                    this.Algo.setStrategy(this.algoStrategy);
                    break;
                case "A* Euclidean":
                    this.algoStrategy = new aStarEuclidean();
                    this.Algo.setStrategy(this.algoStrategy);
                    break;
                case "A* Manhattan":
                    this.algoStrategy = new aStarManhattan();
                    this.Algo.setStrategy(this.algoStrategy);
                    break;
                case "Bidirectional":
                    this.algoStrategy = new bidirectional();
                    this.Algo.setStrategy(this.algoStrategy);
                    break;
            }
            let startBtn = this.view.getElement("startButton");
            startBtn.innerHTML = `Visualize ${eventId}!`;
        }
    }

    handleMazeSelected = (eventEle) => {
        if(this.algoDone){
            this.algoDone = false;
            let eventId = eventEle.dataset.id;
            let maze = new Maze();
            if(eventId === "Recursive Division"){
                this.clearBoard();
                maze.setStrategy(new recursiveDivision());
                let wallNodes = maze.calculateWallNodes(this.model.grid.height, this.model.grid.width);
                //animation sets algoDone to true
                this.animateMaze(wallNodes);
            }
            else if(eventId === "Randomly Initialize"){
                this.randomlyInitialize();
                this.algoDone = true;
            }
            else{
                this.algoDone = true;
            }
        }
    }

    randomlyInitialize(){
        this.clearBoard();
        for(let row = 0; row < this.model.grid.height; row++){
            for(let col = 0; col < this.model.grid.width; col++){
                let currId = `${row}-${col}`;
                let possibleNodes = this.weightNodes.concat();
                possibleNodes.push("none");
                possibleNodes.push("wall");
                let numberOfNodeTypes = possibleNodes.length;
                if(this.model.grid.start !== currId && this.model.grid.end !== currId){
                    this.model.setNodeType(currId, possibleNodes[Math.floor(Math.random() * numberOfNodeTypes)]);
                }
            }
        }
    }

    animateMaze(wallNodes){
        let startBtn = this.view.getElement("startButton");
        startBtn.style.backgroundColor = "red";
        let duration = wallNodes.length * 20 * this.speeds[`${this.currSpeed}`];
        setTimeout(() => {
            this.algoDone = true;
            startBtn.style.backgroundColor = "limegreen";
        }, duration);
        for(let i = 0; i < wallNodes.length; i++){
            setTimeout(() => {
                const node = wallNodes[i];
                if(this.model.grid.start !== node.id && this.model.grid.end !== node.id){
                    this.model.setNodeType(node.id, "wall");
                }
            }, 20 * i * this.speeds[`${this.currSpeed}`]);
        }
    }

    handleMouseDown = (nodeId) => {
        if(this.algoDone){
            this.mouseDown = true;
            let currNode = this.model.getNode(nodeId);
            this.pressedNodeType = currNode.type;
            this.prevNode = this.model.getNode(nodeId);
            this.clearPath();
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
        let startId = `${Math.floor(height / 4)}-${Math.floor(width / 4)}`;
        let endId = `${Math.floor(height * 3 / 4)}-${Math.floor(width * 3 / 4)}`;
        return [startId, endId];
    }

    animateAlgo(visitedNodes, pathNodes){
        let startBtn = this.view.getElement("startButton");
        startBtn.style.backgroundColor = "red";
        let duration = this.calculateAlgoDuration(visitedNodes, pathNodes);
        setTimeout(() => {
            this.algoDone = true;
            startBtn.style.backgroundColor = "limegreen";
        }, duration);
        this.animateVisitedNodes(visitedNodes);
        if(pathNodes.length > 1){
            setTimeout(() => {
                this.animatePathNodes(pathNodes);
            }, 10 * this.speeds[`${this.currSpeed}`] * visitedNodes.length);
        }
    }

    animateVisitedNodes(visitedNodes){
        for(let i = 0; i < visitedNodes.length; i++){
            setTimeout(() => {
                const node = visitedNodes[i];
                this.model.setNodeStatus(node.id, "visited");
            }, 10 * i * this.speeds[`${this.currSpeed}`]);
        }
    }

    animatePathNodes(pathNodes){
        for(let i = 0; i < pathNodes.length; i++){
            setTimeout(() => {
                const node = pathNodes[i];
                this.model.setNodeStatus(node.id, "shortestPath");
            }, 50 * this.speeds[`${this.currSpeed}`] * i);
        }
    }

    calculateAlgoDuration(visitedNodes, pathNodes){
        let duration = 0;
        duration += visitedNodes.length * this.speeds[`${this.currSpeed}`] * 10;
        duration += pathNodes.length * 50 * this.speeds[`${this.currSpeed}`];
        return duration;
    }
}

class View{
    constructor() {
        this.startBtn = this.getElement("startButton");
        this.clearBoard = this.getElement("clearBoard");
        this.clearWalls = this.getElement("clearWalls");
        this.clearPath = this.getElement("clearPath");
        this.clearWeights = this.getElement("clearWeights");
        this.nodeType = this.getElement("nodeType");
        this.speedDropdown = this.getElement("speedDropdown");
        this.selectAlgo = this.getElement("selectAlgo");
        this.refreshBtn = this.getElement("refreshButton");
        this.height = 0;
        this.width = 0;
        this.currExplTab = 0;
        this.watchForHover();
    }

    bindClearBoard(handler){
        this.clearBoard.addEventListener("click", event => {
            let eventEle = event.currentTarget;
            handler(eventEle);
        });
    }

    bindClearWalls(handler){
        this.clearWalls.addEventListener("click", () => {
            handler();
        });
    }

    bindClearPath(handler){
        this.clearPath.addEventListener("click", () => {
            handler();
        });
    }

    bindClearWeights(handler){
        this.clearWeights.addEventListener("click", () => {
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
        this.startBtn.addEventListener("click", () => {
            handler();
        });
    }

    bindRefresh(handler){
        this.refreshBtn.addEventListener("click", () => {
            handler();
        });
    }

    bindVisualizeMaze(handler){
        let mazeList = this.getElement("selectMaze");
        mazeList.addEventListener("click", event => {
            let eventEle = event.target;
            if(eventEle.nodeName === "A"){
                eventEle = eventEle.parentElement;
            }
            handler(eventEle);
        })
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
                currHTMLElement.addEventListener(type, () => {
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

    setupTutorial(){
        let tutorialContent =
            [`<h1>Pathfinding Visualizer Tutorial</h1><h3>Use this short tutorial in order to get used to this website!</h3><h4>If you're ready click on <b>"Start Tutorial"!</b></h4>`,
                `<h1>Motivation and general idea</h1><h3>This website was created in order to visualize different pathfinding algorithms and maze patterns.</h3><h4>Moving from a cell to a neighboring cell has a <b>cost of 1</b>. Depending on the node type of the neighboring cell this cost increases to <b>1 + the weight of the neighboring node</b>. Diagonal movement is not allowed and walls are impenetrable.</h4>`,
                `<h1>Picking an algorithm</h1><h3>Choose the algorithm to visualize from the <b>"Algorithms" dropdown menu</b>. Then click on the <b>"Visualize" button</b>.</h3><h4>Alternatively choose a maze pattern first from the <b>"Mazes & Patterns" dropdown menu</b> for more interesting visualizations.</h4>`,
                `<h1>Algorithms</h1><h5><b>Dijkstra's algorithm:</b> Guarantees shortest path</h5><h5><b>Bidirectional algorithm:</b> Dijkstra's algorithm but bidirectional. Guarantees shortest path.</h5><h5><b>A* algorithm:</b> A* uses heuristics to find the shortest path. The heuristic calculation is done using either the manhattan or the euclidean distance.</h5>`,
                `<h1>Mazes and Patterns</h1><h5><b>Recursive Division:</b> Recursively divides the grid into a maze structure.</h5><h5><b>Randomly Initialize:</b> Initializes every node type of each node randomly.</h5>`,
                `<h1>Adding and moving nodes</h1><h3>Click on the grid in order to add the currently selected node type to the clicked cell. The node type can be selected inside the "Node" dropdown menu. Start and finish nodes can each be moved by clicking and then dragging (not supported on touch events [i.e. mobile] only on click).</h3>`,
                `<h1>Clear</h1><h3>Use the <b>"Clear" dropdown menu</b> to quickly clear the path / the weights / the walls or everything.</h3>`,
                `<h1>Unsatisfied with the Speed?</h1><h3>Use the <b>"Speed" dropdown menu</b> to quickly change the speed to your liking.</h3>`,
                `<h1>Now, play around!</h1><h3>Try different visualizations and have fun! The source code can be found on my <a href="https://github.com/paul0314/pathfinding" id="github">github</a>.</h3>`];
        const maxTabIndex = tutorialContent.length - 1;
        let parView = this;
        let prevExplBtn = this.getElement("prevExplBtn");
        let nextExplBtn = this.getElement("nextExplBtn");
        let closeExplBtn = this.getElement("closeExpl");
        let explContent = this.getElement("explanation-content");
        let explTab = this.getElement("explTab");

        nextExplBtn.addEventListener("click", function () {
            if(parView.currExplTab === 0){
                prevExplBtn.classList.remove("hideBtn");
                nextExplBtn.innerHTML = "next";
            }
            parView.currExplTab += 1;
            if(parView.currExplTab === maxTabIndex){
                nextExplBtn.classList.add("hideBtn");
            }
            explContent.innerHTML = tutorialContent[parView.currExplTab];
        });

        prevExplBtn.addEventListener("click", function () {
            if(parView.currExplTab === maxTabIndex){
                nextExplBtn.classList.remove("hideBtn");
            }
            parView.currExplTab -= 1;
            if(parView.currExplTab === 0){
                prevExplBtn.classList.add("hideBtn");
                nextExplBtn.innerHTML = "Start tutorial";
            }
            explContent.innerHTML = tutorialContent[parView.currExplTab];
        });

        closeExplBtn.addEventListener("click", function () {
            explTab.classList.remove("open-explanation");
        });

        explContent.innerHTML = tutorialContent[this.currExplTab];
        nextExplBtn.innerHTML = "Start tutorial";
        prevExplBtn.innerHTML = "previous";
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
                e.currentTarget.classList.toggle("dropped-down");
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
                    item.classList.remove("dropped-down");
                    content.classList.remove("show-dropdown");
                    content.parentElement.style.backgroundColor = "darkblue";
                }
            });
        });
    }

    //deactivate hover on touch events (i.e. mobile devices)
    watchForHover(){
        let lastTouchTime = 0;
        function enableHover(){
            if(new Date() - lastTouchTime < 500){
                return;
            }
            document.body.classList.add("has-hover");
        }
        function disableHover(){
            document.body.classList.remove("has-hover");
        }
        function updateLastTouchTime(){
            lastTouchTime = new Date();
        }
        document.addEventListener("touchstart", updateLastTouchTime, true);
        document.addEventListener("touchstart", disableHover, true);
        document.addEventListener("mousemove", enableHover, true);
        enableHover();
    }
}



//Create Model, View and Controller after loading HTML
document.addEventListener("DOMContentLoaded", function () {
    let model = new Model();
    let controller = new Controller(model);
});



//helper functions for algorithms
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
            newGrid.changeNodeStatus(currId, grid.getStatus(currId));
            newGrid.changeNodeType(currId, grid.getType(currId));
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



//all algorithms
let Algo = function(){
    this.algo = null;
};

Algo.prototype = {
    setStrategy: function(algo){
        this.algo = algo;
    },

    calculateVisitedNodesInOrder: function(grid){
        return this.algo.calculateVisitedNodesInOrder(grid);
    },

    calculateVisitedNodesAndPathInOrder(paramGrid){
        let grid = deepCopyGrid(paramGrid);
        setupNodes(grid);
        let visitedNodesInOrder = this.calculateVisitedNodesInOrder(grid);
        let pathInOrder;
        if(this.algo.successfull){
            pathInOrder = this.getNodesInPathOrder(visitedNodesInOrder[visitedNodesInOrder.length - 1]);
        }
        else{
            pathInOrder = [];
        }
        return [visitedNodesInOrder, pathInOrder];
    },

    getNodesInPathOrder: function(lastNode){
        return this.algo.getNodesInPathOrder(lastNode);
    }
};

let dijkstra = function(){
    this.calculateVisitedNodesInOrder = function(grid){
        this.successfull = false;
        let startNode = grid.getNode(grid.start);
        let finishNode = grid.getNode(grid.end);
        const visitedNodesInOrder = [];
        const unvisitedNodes = getAllNodes(grid);
        startNode.distance = 0;
        startNode.visited = true;
        while(!!unvisitedNodes.length){
            sortNodesByDistance(unvisitedNodes);
            const closestNode = unvisitedNodes.shift();
            if(closestNode.distance === Infinity){
                return visitedNodesInOrder;
            }
            visitedNodesInOrder.push(closestNode);
            if(closestNode === finishNode){
                this.successfull = true;
                return visitedNodesInOrder;
            }
            updateUnvisitedNeighbors(closestNode, grid);
        }
    }
    this.getNodesInPathOrder = getNodesInPathOrder;
    this.successfull = false;
}

function getNodesInPathOrder(lastNode){
    const nodesInShortestPathOrder = [];
    let currentNode = lastNode;
    while (currentNode != null){
        nodesInShortestPathOrder.unshift(currentNode);
        currentNode = currentNode.previousNode;
    }
    return nodesInShortestPathOrder;
}

function sortNodesByDistance(nodes){
    nodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
}

function getUnvisitedNeighbors(node, grid){
    let neighbors = getNeighbors(node, grid);
    return neighbors.filter(neighbor => !neighbor.visited);
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

function updateUnvisitedNeighbors(node, grid){
    const unvisitedNeighbors = getUnvisitedNeighbors(node, grid);
    for(const neighbor of unvisitedNeighbors){
        neighbor.distance = node.distance + neighbor.weight + 1;
        neighbor.previousNode = node;
        neighbor.visited = true;
    }
}


let aStarManhattan = function(){
    this.calculateVisitedNodesInOrder = function (paramGrid) {
        let parThis = this;
        return aStar(parThis, paramGrid, "manhattan");
    }
    this.getNodesInPathOrder = getNodesInPathOrder;
    this.successfull = false;
}

function aStar(parThis, grid, distanceMeasure){
    parThis.successfull = false;
    let startNode = grid.getNode(grid.start);
    let finishNode = grid.getNode(grid.end);
    const openList = [];
    const visitedNodesInOrder = [];
    openList.push(grid.getNode(grid.start));
    startNode.distance = 0;
    while (!!openList.length) {
        sortNodesAStar(openList, distanceMeasure, grid.end);
        const currNode = openList.shift();
        visitedNodesInOrder.push(currNode);
        if (currNode.type === "wall") continue;
        if (currNode.distance === Infinity) {
            return visitedNodesInOrder;
        }
        currNode.visited = true;
        if (currNode === finishNode) {
            parThis.successfull = true;
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

function sortNodesAStar(nodes, distanceMeasure, endId){
    if(distanceMeasure === "euclidean"){
        nodes.sort((nodeA, nodeB) => nodeA.distance + euclDistToEndNode(nodeA, endId) - nodeB.distance - euclDistToEndNode(nodeB, endId));
    }
    else{
        nodes.sort((nodeA, nodeB) => nodeA.distance + manhattanDistToEndNode(nodeA, endId) - nodeB.distance - manhattanDistToEndNode(nodeB, endId));
    }
}

function manhattanDistToEndNode(node, endId){
    let splitEndId = endId.split("-");
    let yEnd = parseInt(splitEndId[0]);
    let xEnd = parseInt(splitEndId[1]);
    let splitNodeId = node.id.split("-");
    let yNode = parseInt(splitNodeId[0]);
    let xNode= parseInt(splitNodeId[1]);

    return 1.001*Math.abs(xEnd - xNode) + Math.abs(yEnd - yNode);
}

let aStarEuclidean = function(){
    this.calculateVisitedNodesInOrder = function (paramGrid) {
        let parThis = this;
        return aStar(parThis, paramGrid, "euclidean");
    }

    this.getNodesInPathOrder = getNodesInPathOrder;
    this.successfull = false;
}

function euclDistToEndNode(node, endId){
    let splitEndId = endId.split("-");
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


let bidirectional = function(){
    this.calculateVisitedNodesInOrder = function(grid){
        this.setupGridBidirectional(grid);
        this.successfull = false;
        let startNode = grid.getNode(grid.start);
        let finishNode = grid.getNode(grid.end);
        const visitedNodesInOrder = [];
        const unvisitedNodesForward = getAllNodes(grid);
        const unvisitedNodesBackward = getAllNodes(grid);
        startNode.forwardDistance = 0;
        startNode.forwardVisited = true;
        finishNode.backwardDistance = 0;
        finishNode.backwardVisited = true;
        while(!!unvisitedNodesForward.length && !!unvisitedNodesBackward.length){
            this.sortNodesByForwardDistance(unvisitedNodesForward);
            this.sortNodesByBackwardDistance(unvisitedNodesBackward);
            const closestNodeForward = unvisitedNodesForward.shift();
            const closestNodeBackward = unvisitedNodesBackward.shift();
            if(closestNodeForward.forwardDistance === Infinity || closestNodeBackward.backwardDistance === Infinity){
                return visitedNodesInOrder;
            }
            visitedNodesInOrder.push(closestNodeForward);
            visitedNodesInOrder.push(closestNodeBackward);
            if(!!closestNodeForward.backwardVisited){
                this.successfull = true;
                this.lastNode = closestNodeForward;
                return visitedNodesInOrder;
            }
            if(!!closestNodeBackward.forwardVisited){
                this.successfull = true;
                this.lastNode = closestNodeBackward;
                return visitedNodesInOrder;
            }
            this.updateUnvisitedNeighborsForward(closestNodeForward, grid);
            this.updateUnvisitedNeighborsBackward(closestNodeBackward, grid);
        }
    }

    this.successfull = false;
    this.lastNode = null;

    this.getNodesInPathOrder = function(lastNode){
        const nodesInShortestPathOrder = [];
        let currentNode = this.lastNode;
        let forwardNode = this.lastNode.previousForwardNode;
        let backwardNode = this.lastNode.previousBackwardNode;
        if(currentNode !== null){
            nodesInShortestPathOrder.unshift(currentNode);
        }
        while (forwardNode !== null && backwardNode !== null){
            nodesInShortestPathOrder.unshift(forwardNode);
            nodesInShortestPathOrder.unshift(backwardNode);
            forwardNode = forwardNode.previousForwardNode;
            backwardNode = backwardNode.previousBackwardNode;
        }
        while(forwardNode !== null){
            nodesInShortestPathOrder.unshift(forwardNode);
            forwardNode = forwardNode.previousForwardNode;
        }
        while(backwardNode !== null){
            nodesInShortestPathOrder.unshift(backwardNode);
            backwardNode = backwardNode.previousBackwardNode;
        }
        return nodesInShortestPathOrder;
    }

    this.setupGridBidirectional = function(grid){
        for(let row = 0; row < grid.height; row++){
            for(let col = 0; col < grid.width; col++) {
                let currId = `${row}-${col}`;
                let currNode = grid.getNode(currId);
                currNode.previousForwardNode = null;
                currNode.previousBackwardNode = null;
                currNode.forwardDistance = Infinity;
                currNode.backwardDistance = Infinity;
                currNode.forwardVisited = false;
                currNode.backwardVisited = false;
            }
        }
    }

    this.sortNodesByForwardDistance = function(nodes){
        nodes.sort((nodeA, nodeB) => nodeA.forwardDistance - nodeB.forwardDistance);
    }

    this.sortNodesByBackwardDistance = function(nodes){
        nodes.sort((nodeA, nodeB) => nodeA.backwardDistance - nodeB.backwardDistance);
    }

    this.getUnvisitedNeighborsForward = function(node, grid){
        let neighbors = getNeighbors(node, grid);
        return neighbors.filter(neighbor => !neighbor.forwardVisited);
    }

    this.getUnvisitedNeighborsBackward = function(node, grid){
        let neighbors = getNeighbors(node, grid);
        return neighbors.filter(neighbor => !neighbor.backwardVisited);
    }

    this.updateUnvisitedNeighborsBackward = function(node, grid){
        const unvisitedNeighbors = this.getUnvisitedNeighborsBackward(node, grid);
        for(const neighbor of unvisitedNeighbors){
            neighbor.backwardDistance = node.backwardDistance + neighbor.weight + 1;
            neighbor.previousBackwardNode = node;
            neighbor.backwardVisited = true;
        }
    }

    this.updateUnvisitedNeighborsForward = function(node, grid){
        const unvisitedNeighbors = this.getUnvisitedNeighborsForward(node, grid);
        for(const neighbor of unvisitedNeighbors){
            neighbor.forwardDistance = node.forwardDistance + neighbor.weight + 1;
            neighbor.previousForwardNode = node;
            neighbor.forwardVisited = true;
        }
    }
}



//MazeAlgorithmen ab hier
let Maze = function(){
    this.mazeAlgo = null;
};

Maze.prototype = {
    setStrategy: function(mazeAlgo){
        this.mazeAlgo = mazeAlgo;
    },
    calculateWallNodes: function(height, width){
        let grid = new Grid(height, width);
        return this.mazeAlgo.calculateWallNodes(grid);
    },
};

let recursiveDivision = function(){
    this.grid = null;
    this.wallNodes = [];

    this.calculateWallNodes = function(grid){
        this.grid = grid;
        if(this.grid.height % 2 === 1){
            if(this.grid.width % 2 === 1){
                this.divide(this.grid.width, this.grid.height, 0, 0);
            }
            else{
                this.buildVerticalLine(0, this.grid.height - 1, this.grid.width - 1);
                this.divide(this.grid.width - 1, this.grid.height, 0, 0);
            }
        }
        else{
            if(grid.width % 2 === 1){
                this.buildHorizontalLine(0, this.grid.width - 1, this.grid.height - 1);
                this.divide(this.grid.width, this.grid.height - 1, 0, 0);
            }
            else{
                this.buildHorizontalLine(0, this.grid.width - 1, this.grid.height - 1);
                this.buildVerticalLine(0, this.grid.height - 1, this.grid.width - 1);
                this.divide(this.grid.width - 1, this.grid.height - 1, 0, 0);
            }
        }
        return this.wallNodes;
    }

    this.divide = function(width, height, offSetX, offSetY) {
        if (width < 2 || height < 2){
            return;
        }
        let orientation;
        if(width > height){
            orientation = "vertical";
        }
        else if(height > width){
            orientation = "horizontal";
        }
        else{
            orientation = Math.floor(Math.random()*2) === 0 ? "vertical" : "horizontal";
        }
        let possible = this.returnPossiblePathAndWall(orientation, width, height, offSetX, offSetY);
        if(possible.length === 0){
            if(width === 3 && height === 3){
                orientation = orientation === "vertical" ? "horizontal" : "vertical";
                possible = this.returnPossiblePathAndWall(orientation, width, height, offSetX, offSetY);
                if(possible.length === 0){
                    return;
                }
            }
            else{
                return;
            }
        }
        let randomIndex = Math.floor(Math.random() * possible.length);
        let pathIdx = possible[randomIndex][0];
        let wallIdx = possible[randomIndex][1];
        if(orientation === "horizontal"){
            this.buildWall(wallIdx, pathIdx, "horizontal", height, width, offSetX, offSetY);
            this.divide(width, wallIdx - offSetY, offSetX, offSetY);
            this.divide(width, height - wallIdx + offSetY - 1, offSetX, wallIdx + 1);
        }
        else{
            this.buildWall(wallIdx, pathIdx, "vertical", height, width, offSetX, offSetY);
            this.divide(wallIdx - offSetX, height, offSetX, offSetY);
            this.divide(width - wallIdx + offSetX - 1, height, wallIdx + 1, offSetY);
        }
    }

    this.buildVerticalLine = function(startY, endY, x){
        for(let i = 0; i <= (endY - startY); i++){
            let currNode = this.grid.getNode(`${i + parseInt(startY)}-${parseInt(x)}`);
            this.grid.changeNodeType(currNode.id, "wall");
            this.wallNodes.push(currNode);
        }
    }

    this.buildHorizontalLine = function(startX, endX, y){
        for(let i = 0; i <= (endX - startX); i++){
            let currNode = this.grid.getNode(`${parseInt(y)}-${i + parseInt(startX)}`);
            this.grid.changeNodeType(currNode.id, "wall");
            this.wallNodes.push(currNode);
        }
    }

    this.buildWall = function(wallIdx, pathIdx, orientation, height, width, offsetX, offsetY){
        if(orientation === "horizontal"){
            for(let i = 0; i < width; i++){
                let currNode = this.grid.getNode(`${parseInt(wallIdx)}-${i + parseInt(offsetX)}`);
                if(i !== pathIdx){
                    this.grid.changeNodeType(currNode.id, "wall");
                    this.wallNodes.push(currNode);
                }
            }
        }
        else{
            for(let i = 0; i < height; i++){
                let currNode = this.grid.getNode(`${i + parseInt(offsetY)}-${parseInt(wallIdx)}`);
                if(i !== pathIdx){
                    this.grid.changeNodeType(currNode.id, "wall");
                    this.wallNodes.push(currNode);
                }
            }
        }
    }

    this.returnPossiblePathAndWall = function(orientation, width, height, offsetX, offsetY){
        let possible = [];
        if(orientation === "horizontal"){
            for(let i = 1; i < height - 1; i++){
                let x = parseInt(offsetX);
                let y = parseInt(offsetY) + i;
                if(this.outOfBounce(x - 1, y) || this.isWall(x - 1, y)){
                    if(this.outOfBounce(x + width, y) || this.isWall(x + width, y)){
                        for(let j = offsetX; j < offsetX + width; j++){
                            possible.push([j - offsetX,y]);
                        }
                    }
                    else{
                        possible.push([x + width - 1 - offsetX,y]);
                    }
                }
                else{
                    if(this.outOfBounce(x + width, y) || this.isWall(x + width, y)){
                        possible.push([x - offsetX,y]);
                    }
                }
            }
        }
        else{
            for(let i = 1; i < width - 1; i++){
                let x = parseInt(offsetX) + i;
                let y = parseInt(offsetY);
                if(this.outOfBounce(x, y - 1) || this.isWall(x, y - 1)){
                    if(this.outOfBounce(x, y + height) || this.isWall(x, y + height)){
                        for(let j = offsetY; j < offsetY + height; j++){
                            possible.push([j - offsetY,x]);
                        }
                    }
                    else{
                        possible.push([y + height - 1 - offsetY, x]);
                    }
                }
                else{
                    if(this.outOfBounce(x, y + height) || this.isWall(x, y + height)){
                        possible.push([y - offsetY,x]);
                    }
                }
            }
        }
        return possible.filter(array => array[1] % 2);
    }

    this.outOfBounce = function(x, y) {
        return this.grid.height <= y || this.grid.width <= x || x < 0 || y < 0;

    }

    this.isWall = function(x,y){
        return this.grid.getNode(`${parseInt(y)}-${parseInt(x)}`).type === "wall";
    }
}