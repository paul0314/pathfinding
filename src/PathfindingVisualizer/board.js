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
        this.mouseDown = false;
        this.keyDown = false;
        this.algoDone = false;
        this.currentAlgo = null;
        this.speed = "fast";
    }
    createGrid(){
        let tableHTML = "";
        for(let row = 0; row < this.height; row++){
            let currRow = [];
            let rowHTML = `<tr id="row ${row}">`;
            for(let col = 0; col < this.width; col++){
                let idNewNode = `${row}-${col}`;
                let newNode = new Node(idNewNode, "unvisited");
                this.nodes[`${idNewNode}`] = newNode;
                currRow.push(newNode);
                rowHTML += `<td id="${idNewNode}" class="unvisited"></td>`;
            }
            this.board.push(currRow);
            tableHTML += `${rowHTML}</tr>`
        }
        grid.innerHTML = tableHTML;
    }

    addEventListeners(){
        for(let row = 0; row < this.height; row++){
            for(let col = 0; col < this.width; col++){
                let currId = `${row}-${col}`;
                let currNode = this.getNode(currId);
                let currHTMLElement = document.getElementById(currId);
                currHTMLElement.addEventListener("mousedown", function () {

                });
                currHTMLElement.addEventListener("mouseup", function () {

                });
                currHTMLElement.addEventListener("mouseenter", function () {

                });
                currHTMLElement.addEventListener("mouseleave", function () {

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
        start.classList.add("start");
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
        end.classList.add("end");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const navHeight = nav.getBoundingClientRect().height;
    const grid = new Grid(Math.floor((window.innerHeight - navHeight - 42) / 26.5),Math.floor(window.innerWidth / 26.5));
    grid.createGrid();
    grid.setEnd = `${Math.floor(grid.height * 3 / 4)}-${Math.floor(grid.width * 3 / 4)}`;
    grid.setStart = `${Math.floor(grid.height / 4)}-${Math.floor(grid.width / 4)}`;
    grid.addEventListener();
});