const dijkstra = (graph, start, end) => {
    const distances = {};
    const previous = {};
    const queue = new Set(Object.keys(graph));

    Object.keys(graph).forEach((node) => {
        distances[node] = Infinity;
        previous[node] = null;
    });
    distances[start] = 0;

    while (queue.size) {
        const current = Array.from(queue).reduce((minNode, node) =>
            distances[node] < distances[minNode] ? node : minNode
        );

        queue.delete(current);

        if (current === end) break;

        Object.keys(graph[current]).forEach((neighbor) => {
            const alt = distances[current] + graph[current][neighbor];
            if (alt < distances[neighbor]) {
                distances[neighbor] = alt;
                previous[neighbor] = current;
            }
        });
    }

    const path = [];
    let current = end;
    while (current) {
        path.unshift(current);
        current = previous[current];
    }

    return { path, distance: distances[end] };
};

const heuristic = (node, goal, coordinates) => {
    const [x1, y1] = coordinates[node];
    const [x2, y2] = coordinates[goal];
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
};

const aStar = (graph, start, end, coordinates) => {
    const openSet = new Set([start]);
    const cameFrom = {};
    const gScore = { [start]: 0 };
    const fScore = { [start]: heuristic(start, end, coordinates) };

    while (openSet.size) {
        const current = Array.from(openSet).reduce((minNode, node) =>
            fScore[node] < fScore[minNode] ? node : minNode
        );

        if (current === end) {
            const path = [];
            let temp = current;
            while (temp) {
                path.unshift(temp);
                temp = cameFrom[temp];
            }
            return { path, distance: gScore[end] };
        }

        openSet.delete(current);

        Object.keys(graph[current]).forEach((neighbor) => {
            const tentativeGScore = gScore[current] + graph[current][neighbor];
            if (tentativeGScore < (gScore[neighbor] || Infinity)) {
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentativeGScore;
                fScore[neighbor] = gScore[neighbor] + heuristic(neighbor, end, coordinates);
                openSet.add(neighbor);
            }
        });
    }

    return { path: [], distance: Infinity }; // Si no hay ruta
};

export {dijkstra, aStar};