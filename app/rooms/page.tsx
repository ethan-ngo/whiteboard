"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState } from "react";

export default function RoomsList() {
  const { rooms } = useQuery(api.myFunctions.listRooms) ?? { rooms: [] };
  const createRoom = useMutation(api.myFunctions.createRoom);
  const [newRoomName, setNewRoomName] = useState("");

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    await createRoom({ name: newRoomName });
    setNewRoomName("");
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex gap-4">
        <input
          type="text"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="Enter room name"
          className="px-4 py-2 border rounded-md"
        />
        <button
          onClick={handleCreateRoom}
          className="px-4 py-2 bg-foreground text-background rounded-md"
        >
          Create Room
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {rooms.map(room => (
          <Link 
            key={room._id} 
            href={`/board/${room._id}`}
            className="p-4 border rounded-lg hover:bg-gray-50"
          >
            {room.name}
          </Link>
        ))}
      </div>
    </div>
  );
}