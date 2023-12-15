import jsToolsDockerfile from "./dockerfiles/js-tools.dockerfile";
import goToolsDockerfile from "./dockerfiles/go-tools.dockerfile";
import child_process from "child_process";
import fs from "fs";
import tmp from "tmp";
import util from "util";
import path from "path";
import ShellCommandExecutor from "./shell-command-executor";
import ansiColors from "ansi-colors";

const exec = util.promisify(child_process.exec);
const writeFile = util.promisify(fs.writeFile);

export type DockerfileType = "js-tools" | "go-tools";

export default class DockerShellCommandExecutor {
  dockerfileType: DockerfileType;
  workingDirectory: string;

  constructor(workingDirectory: string, dockerfileType: DockerfileType) {
    this.workingDirectory = workingDirectory;
    this.dockerfileType = dockerfileType;
  }

  static async buildImage(dockerfileType: DockerfileType) {
    const dockerfilePath = tmp.fileSync().name;
    await writeFile(dockerfilePath, this.dockerfileContents(dockerfileType));
    await ShellCommandExecutor.execute(`docker build -t course-sdk-${dockerfileType} -f ${dockerfilePath} .`, {
      prefix: ansiColors.yellow("[docker-build] "),
    });
  }

  async exec(command: string) {
    await exec(`docker run --rm -v ${this.workingDirectory}:/workdir -w /workdir course-sdk-${this.dockerfileType} ${command}`);
  }

  // Returns the path to a file inside the container
  containerPath(filePath: string): string {
    return path.relative(this.workingDirectory, filePath);
  }

  static dockerfileContents(dockerfileType: DockerfileType): string {
    return {
      "js-tools": fs.readFileSync(jsToolsDockerfile).toString(),
      "go-tools": fs.readFileSync(goToolsDockerfile).toString(),
    }[dockerfileType];
  }
}
