const dijkstra = (graph, start) => {
    const distances = {};
    const previous = {};
    const queue = new Set();
  
    // Inicializa las distancias y la cola
    for (const vertex in graph) {
      distances[vertex] = Infinity;
      previous[vertex] = null;
      queue.add(vertex); 
    }
    distances[start] = 0; // La distancia al nodo inicial es 0
  
    while (queue.size > 0) {
      // Encuentra el nodo con la distancia mínima
      let minVertex = null;
      for (const vertex of queue) {
        if (minVertex === null || distances[vertex] < distances[minVertex]) {
          minVertex = vertex;
        }
      }
  
      
      if (distances[minVertex] === Infinity) {
        break;
      }
  
      // Elimina el nodo de la cola
      queue.delete(minVertex);
  
      // Actualiza las distancias 
      for (const neighbor in graph[minVertex]) {
        const alt = distances[minVertex] + graph[minVertex][neighbor];
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt; // Actualiza la distancia
          previous[neighbor] = minVertex; // Guarda el nodo anterior
        }
      }
    }
  
    return { distances, previous };
  };

  export default dijkstra;