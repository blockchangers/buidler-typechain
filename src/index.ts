import fsExtra from "fs-extra";
import { TASK_CLEAN, TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { extendConfig, task } from "hardhat/config";
import { HardhatPluginError } from "hardhat/plugins";
import { tsGenerator } from "ts-generator";
import { TypeChain } from "typechain/dist/TypeChain";
import { getDefaultTypechainConfig } from "./config";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";
import "./type-extensions";

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    const userReactPath = userConfig.paths;
    // let newReactPath: string;
    // if (userReactPath === undefined) {
    //   newReactPath = path.join(config.paths.root, "./frontend/src/hardhat");
    // } else {
    //   if (path.isAbsolute(userReactPath)) {
    //     newReactPath = userReactPath;
    //   } else {
    //     // We resolve relative paths starting from the project's root.
    //     // Please keep this convention to avoid confusion.
    //     newReactPath = path.normalize(
    //       path.join(config.paths.root, userReactPath)
    //     );
    //   }
    // }

    // config.paths.react = newReactPath;
  }
);

task(
  "typechain",
  "Generate Typechain typings for compiled contracts"
).setAction(async ({}, { config, run }) => {
  const typechain = getDefaultTypechainConfig(config);
  const typechainTargets = ["ethers-v5", "web3-v1", "truffle-v5"];
  if (!typechainTargets.includes(typechain.target as string)) {
    throw new HardhatPluginError(
      "Typechain",
      "Invalid Typechain target, please provide via hardhat.config.js (typechain.target)"
    );
  }

  await run(TASK_COMPILE);

  console.log(
    `Creating Typechain artifacts in directory ${typechain.outDir} for target ${typechain.target}`
  );

  const cwd = process.cwd();
  await tsGenerator(
    { cwd },
    new TypeChain({
      cwd,
      rawConfig: {
        files: `${config.paths.artifacts}/*.json`,
        outDir: typechain.outDir,
        target: typechain.target as string,
      },
    })
  );

  console.log(`Successfully generated Typechain artifacts!`);
});

task(
  TASK_CLEAN,
  "Clears the cache and deletes all artifacts",
  async (_, { config }) => {
    await fsExtra.remove(config.paths.cache);
    await fsExtra.remove(config.paths.artifacts);
    if (config.typechain && config.typechain.outDir) {
      await fsExtra.remove(config.typechain.outDir);
    }
  }
);
