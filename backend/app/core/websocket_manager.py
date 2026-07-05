from fastapi import WebSocket
from typing import List
import json


class WebSocketManager:
    """Manages all active WebSocket connections."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket connected — {len(self.active_connections)} active")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"WebSocket disconnected — {len(self.active_connections)} active")

    async def broadcast(self, data: dict):
        """Send a message to all connected clients."""
        if not self.active_connections:
            return
        message = json.dumps(data)
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.disconnect(d)


# Single global instance used across the app
manager = WebSocketManager()