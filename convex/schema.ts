import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
  strokes: defineTable({
    points: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
      })
    ),
    color: v.string(),
    size: v.number(),
    author: v.optional(v.string()),
    createdAt: v.number(),
  }),
  canvas: defineTable({
    roomID: v.id("rooms"),
    saveData: v.string(),
    author: v.string(),
    createdAt: v.number(),
  }).index("by_creation", ["createdAt"]),
  rooms: defineTable({
    name: v.string(),
    ownerId: v.string(),
    createdAt: v.number(),
    members: v.array(v.string()), // Array of user IDs who can access
  }).index("by_member", ["members"]),
  
});


