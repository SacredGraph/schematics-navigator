import neo4j from "neo4j-driver";

if (!process.env.NEO4J_URI) {
  throw new Error("NEO4J_URI environment variable is not set");
}

if (!process.env.NEO4J_USER) {
  throw new Error("NEO4J_USER environment variable is not set");
}

if (!process.env.NEO4J_PASSWORD) {
  throw new Error("NEO4J_PASSWORD environment variable is not set");
}

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

export const getSession = () => {
  return driver.session({
    database: process.env.NEO4J_DATABASE || "neo4j",
  });
};

export const closeDriver = async () => {
  await driver.close();
};

export default driver;
