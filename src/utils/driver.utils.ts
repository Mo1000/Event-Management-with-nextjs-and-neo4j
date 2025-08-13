import Neode from "neode";
export const driver = new Neode(
  "neo4j://localhost:7687", // or neo4j:// for routing
  "neo4j",
  "admin@12345"
);
