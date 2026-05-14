const MIN_SYNC_INTERVAL_MS = 33;

const lastSyncBySocket = new Map();

const MAX_SCENE_BODIES = 200;
const MAX_SCENE_CONNECTORS = 150;

function roomChannel(roomId) {
  return `room:${roomId}`;
}

function sanitizeSceneArrays(bodies, connectors) {
  const b = Array.isArray(bodies) ? bodies.slice(0, MAX_SCENE_BODIES) : [];
  const c = Array.isArray(connectors)
    ? connectors.slice(0, MAX_SCENE_CONNECTORS)
    : [];
  return { bodies: b, connectors: c };
}

export function attachRoomHandlers(io, socket) {
  socket.on("room:join", (roomId) => {
    if (typeof roomId !== "string" || roomId.length > 128) return;
    const prev = socket.data?.currentRoom;
    if (prev && prev !== roomId) {
      socket.leave(roomChannel(prev));
    }
    socket.join(roomChannel(roomId));
    socket.data = socket.data || {};
    socket.data.currentRoom = roomId;
  });

  socket.on("room:leave", () => {
    const prev = socket.data?.currentRoom;
    if (prev) {
      socket.leave(roomChannel(prev));
      socket.data.currentRoom = null;
    }
    lastSyncBySocket.delete(socket.id);
  });

  socket.on("room:physics-sync", (payload) => {
    if (!payload || typeof payload.roomId !== "string") return;
    const { roomId, bodies } = payload;
    if (!Array.isArray(bodies)) return;

    const now = Date.now();
    const last = lastSyncBySocket.get(socket.id) || 0;
    if (now - last < MIN_SYNC_INTERVAL_MS) return;
    lastSyncBySocket.set(socket.id, now);

    socket.to(roomChannel(roomId)).emit("room:physics-sync", {
      roomId,
      bodies,
      t: now,
    });
  });

  socket.on("room:discrete", (payload) => {
    if (!payload || typeof payload.roomId !== "string" || !payload.type) return;
    socket.to(roomChannel(payload.roomId)).emit("room:discrete", payload);
  });

  socket.on("room:request-scene", (payload) => {
    const roomId = payload?.roomId;
    if (typeof roomId !== "string" || roomId.length > 128) return;
    socket.to(roomChannel(roomId)).emit("room:scene-pull", {
      roomId,
      requesterId: socket.id,
    });
  });

  socket.on("room:scene-push", (payload) => {
    if (!payload || typeof payload.roomId !== "string") return;
    const targetSocketId = payload.targetSocketId;
    if (typeof targetSocketId !== "string" || targetSocketId.length > 128) return;
    const { bodies, connectors } = sanitizeSceneArrays(
      payload.bodies,
      payload.connectors
    );
    io.to(targetSocketId).emit("room:scene-apply", {
      roomId: payload.roomId,
      bodies,
      connectors,
    });
  });

  socket.on("room:scene-announce", (payload) => {
    if (
      !payload ||
      typeof payload.roomId !== "string" ||
      payload.roomId.length > 128
    )
      return;
    const { roomId } = payload;
    const { bodies, connectors } = sanitizeSceneArrays(
      payload.bodies,
      payload.connectors
    );
    socket.to(roomChannel(roomId)).emit("room:scene-apply", {
      roomId,
      bodies,
      connectors,
    });
  });

  socket.on("disconnect", () => {
    lastSyncBySocket.delete(socket.id);
  });
}
