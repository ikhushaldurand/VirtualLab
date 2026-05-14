export function roomSnapshotStorageKey(roomId) {
  return `vl-room-snapshot-${roomId}`;
}

/** @typedef {{ roomId: string, roomName: string, savedAt: number }} SavedRoomMeta */

export function userSavedRoomsKey(userId) {
  return `vl-user-saved-rooms-${userId}`;
}

/**
 * @param {string} userId
 * @returns {SavedRoomMeta[]}
 */
export function readUserSavedRooms(userId) {
  if (!userId || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(userSavedRoomsKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x) =>
        x &&
        typeof x.roomId === "string" &&
        typeof x.roomName === "string" &&
        typeof x.savedAt === "number"
    );
  } catch {
    return [];
  }
}

/**
 * @param {string} userId
 * @param {Pick<SavedRoomMeta, "roomId" | "roomName" | "savedAt">} meta
 */
export function upsertUserSavedRoom(userId, meta) {
  if (!userId || !meta?.roomId) return false;
  const list = readUserSavedRooms(userId);
  const entry = {
    roomId: meta.roomId,
    roomName: meta.roomName?.trim() || "Untitled Room",
    savedAt: meta.savedAt ?? Date.now(),
  };
  const idx = list.findIndex((x) => x.roomId === entry.roomId);
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  list.sort((a, b) => b.savedAt - a.savedAt);
  try {
    window.localStorage.setItem(userSavedRoomsKey(userId), JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} userId
 * @param {string} roomId
 */
export function removeUserSavedRoom(userId, roomId) {
  if (!userId || !roomId) return false;
  const list = readUserSavedRooms(userId).filter((x) => x.roomId !== roomId);
  try {
    window.localStorage.setItem(userSavedRoomsKey(userId), JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}
