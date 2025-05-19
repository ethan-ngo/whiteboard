import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// You can read data from the database via a query:
export const listNumbers = query({
  // Validators for arguments.
  args: {
    count: v.number(),
  },

  // Query implementation.
  handler: async (ctx, args) => {
    //// Read the database as many times as you need here.
    //// See https://docs.convex.dev/database/reading-data.
    const numbers = await ctx.db
      .query("numbers")
      // Ordered by _creationTime, return most recent
      .order("desc")
      .take(args.count);
    return {
      viewer: (await ctx.auth.getUserIdentity())?.name ?? null,
      numbers: numbers.reverse().map((number) => number.value),
    };
  },
});

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

// You can write data to the database via a mutation:
export const addNumber = mutation({
  // Validators for arguments.
  args: {
    value: v.number(),
  },

  // Mutation implementation.
  handler: async (ctx, args) => {
    //// Insert or modify documents in the database here.
    //// Mutations can also read from the database like queries.
    //// See https://docs.convex.dev/database/writing-data.

    const id = await ctx.db.insert("numbers", { value: args.value });

    console.log("Added new document with id:", id);
    // Optionally, return a value from your mutation.
    // return id;
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
export const myAction = action({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    //// Use the browser-like `fetch` API to send HTTP requests.
    //// See https://docs.convex.dev/functions/actions#calling-third-party-apis-and-using-npm-packages.
    // const response = await ctx.fetch("https://api.thirdpartyservice.com");
    // const data = await response.json();

    //// Query data by running Convex queries.
    const data = await ctx.runQuery(api.myFunctions.listNumbers, {
      count: 10,
    });
    console.log(data);

    //// Write data by running Convex mutations.
    await ctx.runMutation(api.myFunctions.addNumber, {
      value: args.first,
    });
  },
});

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
    if (!room) throw new Error("Room not found");

    await ctx.db.patch(args.roomID, {
      members: [...room.members, args.userId]
    })
  }
})

export const listRooms = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { rooms: [] };

    // Find all rooms where the user is a member
    const rooms = await ctx.db
      .query("rooms")
      .collect();

    return {
      rooms: rooms.map(room => ({
        _id: room._id,
        name: room.name,
        ownerId: room.ownerId,
        isOwner: room.ownerId === identity.subject,
        memberCount: room.members.length,
        createdAt: room.createdAt
      }))
    };
  }
});