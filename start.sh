#!/bin/bash
SESSION="construct"

echo "Starting The Construct..."

# Start Hermes gateway (systemd service)
systemctl --user start hermes-gateway
echo "✓ Hermes gateway started"

tmux new-session -d -s $SESSION

# Pane 1 - Convex backend
tmux send-keys -t $SESSION "docker run --network host -v convex-data:/convex/data -e INSTANCE_SECRET=e6321eb985f7f846b317bfa13eb2b2da5c801df4210057d3e3ec129fad146afa -e CONVEX_CLOUD_ORIGIN=http://127.0.0.1:3210 -e CONVEX_SITE_ORIGIN=http://127.0.0.1:3211 ghcr.io/get-convex/convex-backend:latest" Enter

# Pane 2 - Ollama
tmux split-window -h -t $SESSION
tmux send-keys -t $SESSION "OLLAMA_HOST=0.0.0.0:11434 OLLAMA_NUM_PARALLEL=2 ollama serve" Enter

# Pane 3 - Vite frontend
tmux split-window -v -t $SESSION
tmux send-keys -t $SESSION "cd ~/the-construct && npx vite --host" Enter

# Pane 4 - Convex logs
tmux select-pane -t 0
tmux split-window -v -t $SESSION
tmux send-keys -t $SESSION "cd ~/the-construct && npx convex dev --tail-logs --url http://127.0.0.1:3210 --admin-key 'convex-self-hosted|019ccc6cfc6f7c486e83b443e5b82a691a1f2cae355513e9dd93cfc18a27807f184284f312'" Enter

tmux attach-session -t $SESSION
