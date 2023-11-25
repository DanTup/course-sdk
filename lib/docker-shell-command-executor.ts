import jsToolsDockerfile from "./dockerfiles/js-tools.dockerfile";
import child_process from "child_process";
import fs from "fs";
import tmp from "tmp";
import util from "util";
import path from "path";

const exec = util.promisify(child_process.exec);
const writeFile = util.promisify(fs.writeFile);

type DockerfileType = "js-tools";

export default class DockerShellCommandExecutor {
  dockerfileType: DockerfileType;
  workingDirectory: string;

  constructor(workingDirectory: string, dockerfileType: DockerfileType) {
    this.workingDirectory = workingDirectory;
    this.dockerfileType = dockerfileType;
  }

  async buildImage() {
    const dockerfilePath = tmp.fileSync().name;
    await writeFile(dockerfilePath, this.dockerfileContents(this.dockerfileType));
    await exec(`docker build -t course-sdk-${this.dockerfileType} -f ${dockerfilePath} .`);
  }

  async exec(command: string) {
    await exec(`docker run --rm -v ${this.workingDirectory}:/workdir -w /workdir course-sdk-${this.dockerfileType} ${command}`);
  }

  // Returns the path to a file inside the container
  containerPath(filePath: string): string {
    return path.relative(this.workingDirectory, filePath);
  }

  dockerfileContents(dockerfileType: DockerfileType): string {
    return {
      "js-tools": fs.readFileSync(jsToolsDockerfile).toString(),
    }[dockerfileType];
  }
}
