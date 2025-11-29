#!/bin/bash
set -e

echo "=== DevStories Development Environment Setup ==="

# 1. Install dependencies
echo "Installing dependencies..."
npm install

# 2. Compile extension
echo "Compiling extension..."
npm run compile

# 3. Run unit tests (Vitest)
echo "Running unit tests..."
npm run test

# 4. Compile and run integration tests
echo "Compiling tests..."
npm run compile-tests

echo "Running integration tests..."
npm run test:integration

# 5. Success
echo ""
echo "All tests passed."
