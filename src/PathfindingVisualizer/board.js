const grid = document.getElementById("table-grid");
const nav = document.getElementById("nav");

class Node{
    constructor(id, status){
        this.id = id;
        this.status = status;
        this.previousNode = null;
        this.distance = null;
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
        this.pressedNodeStatus = "normal";
        this.lastUpdatedNode = null;
        this.mouseDown = false;
        this.keyDown = false;
        this.algoDone = false;
        this.currentAlgo = null;
        this.speed = "fast";
        this.prevNode = null;
        this.prevNodeStatus = null;
    }
    createGrid(){
        let tableHTML = "";
        for(let row = 0; row < this.height; row++){
            let currRow = [];
            let rowHTML = `<tr id="row ${row}">`;
            for(let col = 0; col < this.width; col++){
                let idNewNode = `${row}-${col}`;
                let newNode = new Node(idNewNode, "normal");
                this.nodes[`${idNewNode}`] = newNode;
                currRow.push(newNode);
                rowHTML += `<td id="${idNewNode}" class="unvisited"></td>`;
            }
            this.board.push(currRow);
            tableHTML += `${rowHTML}</tr>`
        }
        grid.innerHTML = tableHTML;
    }

    changeSpecialNodes = function(node){
        let parGrid = this;
        let element = document.getElementById(node.id);
        let previousElement;

        if(this.prevNode){
            previousElement = document.getElementById(this.prevNode.id);
            if(node.status !== "start" && node.status !== "end"){
                if(this.prevNode.status === "start"){
                    parGrid.setStart = node.id;
                }
                if(this.prevNode.status === "end"){
                    parGrid.setEnd = node.id;
                }
                previousElement.className = "unvisited";
                node.status = this.prevNode.status;
            }
        }
    }

    /*changeSpecialNodes muss auch beim Verlassen eines Knotens aufgerufen werden*/

    changeNormalNodes(node){
        let element = document.getElementById(node.id);
        if(element.classList.contains("start") || element.classList.contains("end")){
            return;
        }
        element.classList.toggle("wall");
        element.classList.toggle("unvisited");
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
                    parGrid.pressedNodeStatus = currNode.status;
                    parGrid.prevNode = currNode;
                    if(currNode.status === "normal"){
                        parGrid.changeNormalNodes(currNode);
                    }
                });
                currHTMLElement.addEventListener("mouseup", function () {
                    parGrid.mouseDown = false;
                    parGrid.pressedNodeStatus = "normal";
                    parGrid.prevNode = null;
                    parGrid.prevNodeStatus = null;
                });
                currHTMLElement.addEventListener("mouseenter", function () {
                    if(parGrid.mouseDown === true){
                        if(parGrid.pressedNodeStatus === "normal"){
                            parGrid.changeNormalNodes(currNode);
                        }
                        else{
                            parGrid.changeSpecialNodes(currNode);
                        }
                        parGrid.prevNodeStatus = currNode.status;
                    }
                });
                currHTMLElement.addEventListener("mouseleave", function () {
                    if(parGrid.mouseDown && parGrid.pressedNodeStatus !== "normal"){
                        parGrid.prevNode = parGrid.getNode(currId);
                    }
                });
            }
        }
    }

    getNode(id){
        let splitId = id.split("-");
        return this.board[splitId[0]][splitId[1]];
    }

    set setStart(startId){
        let splitId = startId.split("-");
        if(splitId[0] >= this.height){
            return;
        }
        if(splitId[1] >= this.width){
            return;
        }
        const start = document.getElementById(startId);
        this.start = `${startId}`;
        start.className = "start";
        this.nodes[`${startId}`].status = "start";
    }

    set setEnd(endId){
        let splitId = endId.split("-");
        if(splitId[0] >= this.height){
            return;
        }
        if(splitId[1] >= this.width){
            return;
        }
        const end = document.getElementById(endId);
        this.end = `${endId}`;
        end.className = "end";
        this.nodes[`${endId}`].status = "end";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const navHeight = nav.getBoundingClientRect().height;
    const grid = new Grid(Math.floor((window.innerHeight - navHeight - 42) / 26.5),Math.floor(window.innerWidth / 26.5));
    grid.createGrid();
    grid.setEnd = `${Math.floor(grid.height * 3 / 4)}-${Math.floor(grid.width * 3 / 4)}`;
    grid.setStart = `${Math.floor(grid.height / 4)}-${Math.floor(grid.width / 4)}`;
    grid.addEventListeners();
});