/*Dijkstra currently without weight functionality*/

/*
function dijkstra (grid){
    let startNode = grid.start;
    let finishNode = grid.end;
    const visitedNodesInOrder = [];
    const unvisitedNodes = getAllNodes(grid);
    for(const nodes of unvisitedNodes){
        nodes.distance = "infinity";
    }
    startNode.distance = 0;
    while(!!unvisitedNodes.length){
        sortNodesByDistance(unvisitedNodes);
        const closestNode = unvisitedNodes.shift();
        if(closestNode.status === "wall") continue;
        if(closestNode.distance === "infinity"){
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
    for(const row of grid){
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
    const row = coordinates[0];
    const col = coordinates[1];
    if(row > 0){
        neighbors.push(grid[row - 1][col]);
    }
    if(col > 0){
        neighbors.push(grid[row][col - 1]);
    }
    if(row < grid.height){
        neighbors.push(grid[row + 1][col]);
    }
    if(col < grid.width){
        neighbors.push(grid[row][col + 1]);
    }
    return neighbors.filter(neighbor => !neighbor.visited);
}

function updateUnvisitedNeighbors(node, grid){
    const unvisitedNeighbors = getUnvisitedNeighbors(node, grid);
    for(const neighbor of unvisitedNeighbors){
        neighbor.distance = node.distance + 1;
        neighbor.prevNode = node;
    }
}

function getNodesInShortestPathOrder(finishNode){
    const nodesInShortestPathOrder = [];
    let currentNode = finishNode;
    while (currentNode != null){
        nodesInShortestPathOrder.unshift(currentNode);
        currentNode = currentNode.previousNode;
    }
    return nodesInShortestPathOrder;
}
*/