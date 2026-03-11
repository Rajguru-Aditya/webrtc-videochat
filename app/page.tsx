"use client";

import { useRef, useState } from "react";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const pc1 = useRef<RTCPeerConnection | null>(null);

  const localStream = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStream.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // show remote video
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // send our local stream
    localStream.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStream.current!);
    });

    return pc;
  };

  const createRoom = async () => {
    if (!localStream.current) {
      alert("Start camera first");
      return;
    }
    const roomRef = doc(collection(db, "rooms"));

    pc1.current = createPeerConnection();

    if (!pc1.current) return;

    const offer = await pc1.current.createOffer();
    await pc1.current.setLocalDescription(offer);

    const callerCandidatesCollection = collection(roomRef, "callerCandidates");

    pc1.current.onicecandidate = (event) => {
      if (event.candidate) {
        setDoc(
          doc(callerCandidatesCollection),
          event.candidate.toJSON()
        );
      }
    };

    await setDoc(roomRef, { offer });

    onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data();

      if (!pc1.current?.currentRemoteDescription && data?.answer) {
        await pc1.current?.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    });

    setRoomId(roomRef.id);

    const calleeCandidatesCollection = collection(roomRef, "calleeCandidates");

    onSnapshot(calleeCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());

          pc1.current?.addIceCandidate(candidate);
        }
      });
    });
  };

  const joinRoom = async () => {
    if (!localStream.current) {
      alert("Start camera first");
      return;
    }
    const roomRef = doc(db, "rooms", roomId);
    const roomSnapshot = await getDoc(roomRef);

    if (!roomSnapshot.exists()) {
      alert("Room does not exist");
      return;
    }
    
    pc1.current = createPeerConnection();

    if (!pc1.current) return;

    const calleeCandidatesCollection = collection(roomRef, "calleeCandidates");

    pc1.current.onicecandidate = (event) => {
      if (event.candidate) {
        setDoc(
          doc(calleeCandidatesCollection),
          event.candidate.toJSON()
        );
      }
    };

    const offer = roomSnapshot.data()?.offer;

    await pc1.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    const answer = await pc1.current.createAnswer();
    await pc1.current.setLocalDescription(answer);

    await updateDoc(roomRef, { answer });

    const callerCandidatesCollection = collection(roomRef, "callerCandidates");

    onSnapshot(callerCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());

          pc1.current?.addIceCandidate(candidate);
        }
      });
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full flex-col items-center py-10 px-16 bg-white dark:bg-black  gap-10">
        <div className="w-full flex items-center justify-center gap-5">
          {/* User 1 */}
          <div className="w-full flex flex-col justify-center items-center">
            {/* video stream */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-3xl h-150 bg-cyan-100"
            />
            <h1 className="text-white text-2xl font-bold">User 1</h1>
          </div>
          {/* User 2 */}
          <div className="w-full flex flex-col justify-center items-center">
            {/* video stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-3xl h-150 bg-cyan-100"
            />
            <h1 className="text-white text-2xl font-bold">User 2</h1>
          </div>
        </div>
        <button
          onClick={startCamera}
          className="h-15 w-100 bg-white rounded-2xl text-black"
        >
          Start Camera
        </button>
        <button onClick={createRoom}>Create Room</button>

        <button onClick={joinRoom}>Join Room</button>
        <input
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        {/* <button
          onClick={createOffer}
          className="h-15 w-100 bg-white rounded-2xl text-black"
        >
          Create Offer
        </button> */}
      </main>
    </div>
  );
}
