const grid = document.getElementById("table-grid");

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
    const grid = new Grid(15,30);
    grid.createGrid();
    grid.setEnd = "10-25";
    grid.setStart = "4-4";
});