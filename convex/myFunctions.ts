import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

export const getCanvas = query({
  args: {
    roomID: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    // First verify user has access to this room
    const room = await ctx.db.get(args.roomID);
    if (!room || !room.members.includes(identity?.subject ?? "")) {
      throw new Error("Not authorized to access this room");
    }

    // Query canvas documents where roomID matches and get most recent
    const canvas = await ctx.db
      .query("canvas")
      .filter((q) => q.eq(q.field("roomID"), args.roomID))
      .order("desc")  // Order by creation time descending
      .first();                    // Get the most recent one

    return {
      viewer: identity?.subject ?? "Anonymous",
      canvasData: canvas?.saveData
    };
  },
});

export const updateCanvas = mutation({
  args: {
    roomID: v.id("rooms"),
    saveData: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    await ctx.db.insert("canvas", {
      roomID: args.roomID,
      saveData: args.saveData,
      author: identity?.subject ?? "Anonymous",
      createdAt: Date.now(),
    });
  },
});

// You can fetch data from and send data to third-party APIs via an action:
    //// Use the browser-like `fetch` API to send HTTP requests.
    //// See https://docs.convex.dev/functions/actions#calling-third-party-apis-and-using-npm-packages.
    // const response = await ctx.fetch("https://api.thirdpartyservice.com");
    // const data = await response.json();

export const createRoom = mutation({
  args: {
    name: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.insert("rooms", {
      name: args.name,
      ownerId: identity.subject,
      members: [identity.subject],
      createdAt: Date.now(),
    });
  }
})

export const inviteToRoom = mutation({
  args: {
    roomID: v.id("rooms"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomID)
    if (!room || room.members.includes(args.userId)) return false;

    await ctx.db.patch(args.roomID, {
      members: [...room.members, args.userId]
    })
    return true;
  }
})

export const listRooms = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { rooms: [] };

    const rooms = await ctx.db
      .query("rooms")
      .collect();

    return {
      rooms: rooms
        .filter(room => room.members.includes(identity.subject))
        .map(room => ({
          _id: room._id,
          name: room.name,
          ownerId: room.ownerId,
          isOwner: room.ownerId === identity.subject,
          memberCount: room.members.length,
          createdAt: room.createdAt,
          members: room.members // Add members array
        }))
    };
  }
});

export const deleteRoom = mutation({
  args: {
    roomID: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if user is room owner
    const room = await ctx.db.get(args.roomID);
    if (!room || room.ownerId !== identity.subject) {
      throw new Error("Not authorized to delete this room");
    }

    // Delete all canvases associated with this room
    const canvases = await ctx.db
      .query("canvas")
      .filter((q) => q.eq(q.field("roomID"), args.roomID))
      .collect();

    for (const canvas of canvases) {
      await ctx.db.delete(canvas._id);
    }

    // Delete the room itself
    await ctx.db.delete(args.roomID);
    
    return true;
  }
});