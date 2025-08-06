import { db } from "@/firebase";
import { collection, setDoc, doc, getDocs } from "firebase/firestore";
import { mockTeams, allPlayers } from "./mockData";

// Save teams
export const saveTeamsToFirebase = async () => {
  for (const team of mockTeams) {
    await setDoc(doc(db, "teams", team.id), team);
  }
};

// Load teams
export const loadTeamsFromFirebase = async () => {
  const snapshot = await getDocs(collection(db, "teams"));
  const teams = snapshot.docs.map(doc => doc.data());
  // Replace mockTeams with loaded teams
  mockTeams.length = 0;
  mockTeams.push(...teams);
};

// Save players
export const savePlayersToFirebase = async () => {
  for (const player of allPlayers) {
    await setDoc(doc(db, "players", player.id), player);
  }
};