// Test suite for BFHL API
// Usage: node test.js

const http = require('http');

const API_URL = 'http://localhost:8000';

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/bfhl',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`✓ ${message}`);
    return true;
  } else {
    console.log(`✗ ${message}`);
    console.log(`  Expected: ${JSON.stringify(expected)}`);
    console.log(`  Actual: ${JSON.stringify(actual)}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting BFHL API Tests\n');

  try {
    // Test 1: Valid edges
    console.log('Test 1: Valid edges');
    const result1 = await makeRequest({
      data: ['A->B', 'A->C', 'B->D']
    });
    assertEqual(result1.invalid_entries.length, 0, 'No invalid entries');
    assertEqual(result1.duplicate_edges.length, 0, 'No duplicate edges');
    assertEqual(result1.summary.total_trees, 1, 'One tree created');
    assertEqual(result1.hierarchies[0].depth, 3, 'Depth is 3');
    console.log();

    // Test 2: Invalid entries
    console.log('Test 2: Invalid entries');
    const result2 = await makeRequest({
      data: ['hello', '1->2', 'A->', 'A->A']
    });
    assertEqual(result2.invalid_entries.length, 4, 'All 4 entries invalid');
    assertEqual(result2.hierarchies.length, 0, 'No hierarchies created');
    console.log();

    // Test 3: Duplicate edges
    console.log('Test 3: Duplicate edges');
    const result3 = await makeRequest({
      data: ['A->B', 'A->B', 'A->B']
    });
    assertEqual(result3.duplicate_edges.length, 1, 'One duplicate edge recorded');
    assertEqual(result3.hierarchies.length, 1, 'One tree created');
    console.log();

    // Test 4: Cycle detection
    console.log('Test 4: Cycle detection');
    const result4 = await makeRequest({
      data: ['X->Y', 'Y->Z', 'Z->X']
    });
    assertEqual(result4.hierarchies[0].has_cycle, true, 'Cycle detected');
    assertEqual(result4.hierarchies[0].tree, {}, 'Empty tree for cycle');
    assertEqual(result4.summary.total_cycles, 1, 'One cycle counted');
    console.log();

    // Test 5: Multiple trees
    console.log('Test 5: Multiple trees');
    const result5 = await makeRequest({
      data: ['A->B', 'C->D']
    });
    assertEqual(result5.hierarchies.length, 2, 'Two separate trees');
    assertEqual(result5.summary.total_trees, 2, 'Two trees in summary');
    console.log();

    // Test 6: Diamond case (multiple parents)
    console.log('Test 6: Diamond case (multiple parents)');
    const result6 = await makeRequest({
      data: ['A->D', 'B->D', 'D->E']
    });
    // A->D should be first parent, B->D is ignored
    const depthA = calculateDepth(result6.hierarchies.find(h => h.root === 'A'));
    assertEqual(depthA, 3, 'A tree has depth 3');
    console.log();

    // Test 7: Whitespace trimming
    console.log('Test 7: Whitespace trimming');
    const result7 = await makeRequest({
      data: [' A->B ', 'B->C']
    });
    assertEqual(result7.invalid_entries.length, 0, 'Whitespace trimmed and valid');
    assertEqual(result7.hierarchies.length, 1, 'One tree created');
    console.log();

    // Test 8: Complex example from spec
    console.log('Test 8: Complex example');
    const result8 = await makeRequest({
      data: [
        'A->B', 'A->C', 'B->D', 'C->E', 'E->F',
        'X->Y', 'Y->Z', 'Z->X',
        'P->Q', 'Q->R',
        'G->H', 'G->H', 'G->I',
        'hello', '1->2', 'A->'
      ]
    });
    assertEqual(result8.invalid_entries.length, 3, '3 invalid entries');
    assertEqual(result8.duplicate_edges.length, 1, '1 duplicate edge');
    assertEqual(result8.summary.total_trees, 3, 'Three trees');
    assertEqual(result8.summary.total_cycles, 1, 'One cycle');
    assertEqual(result8.summary.largest_tree_root, 'A', 'Largest tree root is A');
    console.log();

    console.log('✅ All tests completed!\n');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.log('Make sure the API is running on http://localhost:8000');
  }
}

function calculateDepth(hierarchy) {
  if (!hierarchy || !hierarchy.tree || Object.keys(hierarchy.tree).length === 0) {
    return 0;
  }
  return hierarchy.depth || 0;
}

runTests();
