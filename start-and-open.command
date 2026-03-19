#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Ripple..."
echo "Building and starting server at http://localhost:3005"
(sleep 25 && open http://localhost:3005) &
npm run serve
