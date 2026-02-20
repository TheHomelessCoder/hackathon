import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StealMyIdeaModule = buildModule("StealMyIdeaModule", (m) => {
  const stealMyIdea = m.contract("StealMyIdea", []);
  return { stealMyIdea };
});

export default StealMyIdeaModule;
