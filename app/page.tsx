"use client";
import { useMutation, useQuery, Authenticated, Unauthenticated} from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignUpButton } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-800">
              ✏️ Drawboard
            </h1>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Beta
            </span>
          </div>
          <UserButton/>
        </div>
      </header>
      <main className="flex flex-col gap-8">
        <Authenticated>
          <RoomsList />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </>
  );
}

function SignInForm() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Drawboard
          </h2>
          <p className="text-gray-600 mb-6">
            Collaborate on drawings in real-time
          </p>
        </div>
        <div className="space-y-4">
          <SignInButton mode="modal">
            <button className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              Log in to your account
            </button>
          </SignInButton>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                or
              </span>
            </div>
          </div>
          <SignUpButton mode="modal">
            <button className="w-full flex justify-center py-3 px-4 border-2 border-slate-200 rounded-md text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              Create a new account
            </button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
}

function RoomsList() {
  const { user } = useUser();  // Add this hook
  const { rooms } = useQuery(api.myFunctions.listRooms) ?? { rooms: [] };
  const createRoom = useMutation(api.myFunctions.createRoom);
  const inviteRoom = useMutation(api.myFunctions.inviteToRoom);
  const deleteRoom = useMutation(api.myFunctions.deleteRoom);
  const [newRoomName, setNewRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();
  
  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !user) return;
    const id = await createRoom({ name: newRoomName });
    setNewRoomName("");
    router.push('/board/' + id);
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim() || !user) return;
    const hasRoom = await inviteRoom({ 
      roomID: roomCode as Id<"rooms">, 
      userId: user.id 
    });
    if(hasRoom) {
      router.push("/board/" + roomCode);
      setRoomCode("");
    }
    else{
      alert("Room doesn't exist or already in room")
      setRoomCode("");
    }
  };

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: Id<"rooms">) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent event bubbling
    
    if (confirm('Are you sure you want to delete this room?')) {
      await deleteRoom({ roomID: roomId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">          
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Create New Room</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Enter room name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleCreateRoom}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Room
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Join Existing Room</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Enter room code"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleJoinRoom}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Join Room
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">My Rooms</h2>
            {rooms.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No rooms yet. Create one to get started!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => (
                  <div key={room._id} className="relative group">
                    <Link 
                      href={`/board/${room._id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{room.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {room.memberCount} member{room.memberCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {room.isOwner && (
                          <button
                            onClick={(e) => handleDeleteRoom(e, room._id)}
                            className="p-1 hover:bg-red-50 rounded-full"
                            title="Delete room"
                          >
                            <svg 
                              className="w-5 h-5 text-red-500" 
                              fill="none" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="2" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}