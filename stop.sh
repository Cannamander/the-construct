#!/bin/bash
echo "Stopping The Construct..."

# Stop Hermes gateway
systemctl --user stop hermes-gateway
echo "✓ Hermes gateway stopped"

# Kill tmux session
tmux kill-session -t construct 2>/dev/null
echo "✓ tmux session killed"

# Stop Ollama
sudo kill $(pgrep ollama) 2>/dev/null
echo "✓ Ollama stopped"

# Stop Docker containers
docker stop $(docker ps -q) 2>/dev/null
echo "✓ Docker containers stopped"

echo "All systems offline."
