const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Validate node format (X->Y where X,Y are single uppercase letters)
function isValidNode(entry) {
  if (typeof entry !== 'string') return false;
  entry = entry.trim();
  if (!entry) return false;
  const pattern = /^[A-Z]->[A-Z]$/;
  if (!pattern.test(entry)) return false;
  
  // Check for self-loop
  const [parent, child] = entry.split('->');
  if (parent === child) return false; // Self-loop is invalid
  
  return true;
}

// Build tree structure and detect cycles
function buildHierarchies(validEdges) {
  const nodeMap = new Map(); // node -> parent (for cycle detection)
  const adjList = new Map(); // node -> children
  const allNodes = new Set();

  // Process edges
  for (const edge of validEdges) {
    const [parent, child] = edge.split('->');
    allNodes.add(parent);
    allNodes.add(child);

    // First parent wins (diamond case)
    if (!nodeMap.has(child)) {
      nodeMap.set(child, parent);
      if (!adjList.has(parent)) {
        adjList.set(parent, []);
      }
      adjList.get(parent).push(child);
    }
  }

  // Find connected components
  const visited = new Set();
  const hierarchies = [];

  function getComponent(startNode) {
    const component = new Set();
    const queue = [startNode];

    while (queue.length > 0) {
      const node = queue.shift();
      if (component.has(node)) continue;
      component.add(node);

      // Add children
      const children = adjList.get(node) || [];
      for (const child of children) {
        if (!component.has(child)) queue.push(child);
      }

      // Add parent
      if (nodeMap.has(node)) {
        const parent = nodeMap.get(node);
        if (!component.has(parent)) queue.push(parent);
      }
    }

    return component;
  }

  for (const node of allNodes) {
    if (visited.has(node)) continue;

    const component = getComponent(node);
    component.forEach(n => visited.add(n));

    // Find roots in component (nodes with no parent in this component)
    let roots = Array.from(component).filter(n => !nodeMap.has(n) || !component.has(nodeMap.get(n)));

    // If no roots (pure cycle), use lexicographically smallest node
    if (roots.length === 0) {
      roots = [Array.from(component).sort()[0]];
    }

    // Check for cycles
    const hasCycle = detectCycle(roots[0], component, adjList, nodeMap);

    // Build hierarchy for each root
    for (const root of roots) {
      const hierarchy = {};
      hierarchy.root = root;

      if (hasCycle) {
        hierarchy.tree = {};
        hierarchy.has_cycle = true;
      } else {
        hierarchy.tree = buildTree(root, adjList);
        hierarchy.depth = calculateDepth(root, adjList);
      }

      hierarchies.push(hierarchy);
    }
  }

  return hierarchies;
}

function detectCycle(root, component, adjList, nodeMap) {
  const visiting = new Set();
  const visited = new Set();

  function hasCycleDFS(node) {
    if (visited.has(node)) return false;
    if (visiting.has(node)) return true;

    visiting.add(node);
    const children = adjList.get(node) || [];

    for (const child of children) {
      if (component.has(child) && hasCycleDFS(child)) {
        return true;
      }
    }

    visiting.delete(node);
    visited.add(node);
    return false;
  }

  return hasCycleDFS(root);
}

// Build nested tree structure
function buildTree(root, adjList) {
  const tree = {};
  const stack = [{ node: root, obj: tree }];

  while (stack.length > 0) {
    const { node, obj } = stack.pop();
    obj[node] = {};

    const children = adjList.get(node) || [];
    for (const child of children) {
      stack.push({ node: child, obj: obj[node] });
    }
  }

  return tree;
}

// Calculate depth (node count on longest root-to-leaf path)
function calculateDepth(root, adjList) {
  function maxDepth(node) {
    const children = adjList.get(node) || [];
    if (children.length === 0) return 1;
    return 1 + Math.max(...children.map(child => maxDepth(child)));
  }
  return maxDepth(root);
}

// POST /bfhl endpoint
app.post('/bfhl', (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'data must be an array' });
    }

    const invalidEntries = [];
    const seenEdges = new Set();
    const duplicateEdges = [];
    const validEdges = [];

    // Process each entry
    for (let entry of data) {
      entry = entry.trim();

      if (!isValidNode(entry)) {
        invalidEntries.push(entry);
        continue;
      }

      if (seenEdges.has(entry)) {
        duplicateEdges.push(entry);
      } else {
        seenEdges.add(entry);
        validEdges.push(entry);
      }
    }

    // Build hierarchies
    const hierarchies = buildHierarchies(validEdges);

    // Calculate summary
    const totalTrees = hierarchies.filter(h => !h.has_cycle).length;
    const totalCycles = hierarchies.filter(h => h.has_cycle).length;

    let largestTreeRoot = '';
    let maxDepth = 0;
    for (const hierarchy of hierarchies) {
      if (!hierarchy.has_cycle && hierarchy.depth > maxDepth) {
        maxDepth = hierarchy.depth;
        largestTreeRoot = hierarchy.root;
      } else if (!hierarchy.has_cycle && hierarchy.depth === maxDepth && hierarchy.root < largestTreeRoot) {
        largestTreeRoot = hierarchy.root;
      }
    }

    const response = {
      user_id: 'monika_jalla', 
      email_id: 'monika_j@srmap.edu.in', 
      college_roll_number: 'AP23110011563', 
      hierarchies,
      invalid_entries: invalidEntries,
      duplicate_edges: [...new Set(duplicateEdges)], // Remove duplicates from the list itself
      summary: {
        total_trees: totalTrees,
        total_cycles: totalCycles,
        largest_tree_root: largestTreeRoot || null
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
