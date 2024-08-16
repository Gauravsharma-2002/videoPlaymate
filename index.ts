import ffmpeg from "fluent-ffmpeg";
import { promises as fsPromises } from "fs";
import { basename, join } from "path";

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;

const FOLDERS = {
  PREROLL: "./preroll",
  INPUT: "./input",
  OUTPUT: "./output",
  TEMP: "./temp",
};
const PREROLL_ERROR = "please add preroll video to preroll file";
const PREROLL_INPUT = "please add preroll video to input file";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffmpegPath);
// tool path also

function isNull(obj: any) {
  return obj === null || typeof obj === "undefined";
}
function isEmpty(obj: any) {
  return obj === "" || isNull(obj);
}

function isObj(obj: any) {
  return obj != null || typeof obj === "object";
}
function isArray(obj: any) {
  return Object.prototype.toString.call(obj) === "[object Array]";
}

function onError(err: Error) {
  if (isObj(err)) {
    console.log(`Error: ${err.message}`, "\n");
  } else {
    console.log(err, "\n");
  }
  process.exitCode = 1;
}

// merge function
//idea : take preroll and attach preroll to all input and corrosponding produce output in output path
function merge(prePath: string, inputPath: string) {
  return new Promise<void>((resolve, reject) => {
    const inputName = basename(inputPath);

    ffmpeg(prePath)
      .input(inputPath)
      .on("error", reject)
      .on("start", () => {
        console.log(`starting for merge for ${inputName}`);
      })
      .on("end", () => {
        console.log(`${inputName} merged`);
        resolve();
      })
      .mergeToFile(join(FOLDERS.OUTPUT, inputName), <any>FOLDERS.TEMP);
  });
}

async function mergeAll() {
  try {
    const prerollFiles = await fsPromises.readdir(FOLDERS.PREROLL);
    if (!isArray(prerollFiles) || prerollFiles.length === 0) {
      //   throw new Error("please add a video in preroll directory");
      throw new Error(PREROLL_ERROR);
    }
    let preroll: string | undefined;
    for (const p of prerollFiles) {
      const apPath = join(FOLDERS.PREROLL, p);
      const stat = await fsPromises.stat(apPath);
      if (!stat.isDirectory()) {
        preroll = apPath;
        break;
      }
    }
    if (isEmpty(preroll)) {
      throw new Error(PREROLL_ERROR);
    }
    const inputFiles = await fsPromises.readdir(FOLDERS.INPUT);

    if (!isArray(inputFiles) || inputFiles.length === 0) {
      //   throw new Error("please add a video in preroll directory");
      throw new Error(PREROLL_INPUT);
    }

    for (const i in inputFiles) {
      const iPath = join(FOLDERS.INPUT, i);
      const stat = await fsPromises.stat(iPath);
      if (!stat.isDirectory()) {
        await merge(<string>preroll, iPath);
      }
    }
  } catch (e: any) {
    onError(e);
  }
}

mergeAll();
