import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Mix an array of audio file paths into a single output file using FFmpeg.
 * Each input has an optional volume adjustment (in dB).
 */
export interface MixInput {
  filePath: string;
  volumeDb?: number;   // e.g. -6 means -6dB
  startTime?: number;  // offset in seconds
  loop?: boolean;
}

export async function mixAudioFiles(
  inputs: MixInput[],
  outputPath: string,
  totalDuration: number
): Promise<string> {
  if (!inputs.length) throw new Error('No audio inputs provided');

  const tmpDir    = os.tmpdir();
  const tmpOutput = path.join(tmpDir, `mix_${Date.now()}.mp3`);

  // Build ffmpeg filter_complex string
  const inputArgs: string[] = [];
  const filterParts: string[] = [];

  inputs.forEach((inp, i) => {
    const volFactor = inp.volumeDb !== undefined
      ? Math.pow(10, inp.volumeDb / 20)
      : 1;

    const loopFlag = inp.loop ? `-stream_loop -1` : '';
    inputArgs.push(`${loopFlag} -i "${inp.filePath}"`);

    const delay = (inp.startTime ?? 0) * 1000; // milliseconds for adelay
    filterParts.push(
      `[${i}:a]volume=${volFactor.toFixed(4)},adelay=${delay}|${delay}[a${i}]`
    );
  });

  const mergeInputs = inputs.map((_, i) => `[a${i}]`).join('');
  const filterComplex = [
    ...filterParts,
    `${mergeInputs}amix=inputs=${inputs.length}:duration=longest:dropout_transition=0[out]`,
  ].join('; ');

  const cmd = [
    'ffmpeg -y',
    ...inputArgs,
    `-filter_complex "${filterComplex}"`,
    `-map "[out]"`,
    `-t ${totalDuration}`,
    `-ar 48000 -ac 2 -b:a 192k`,
    `"${tmpOutput}"`,
  ].join(' ');

  execSync(cmd, { stdio: 'pipe' });

  // Copy to desired output location
  fs.copyFileSync(tmpOutput, outputPath);
  fs.unlinkSync(tmpOutput);

  return outputPath;
}

/** Convert WAV to MP3 using FFmpeg */
export function convertToMp3(inputPath: string, outputPath: string): void {
  execSync(`ffmpeg -y -i "${inputPath}" -codec:a libmp3lame -b:a 192k -ar 48000 "${outputPath}"`, {
    stdio: 'pipe',
  });
}

/** Get audio duration in seconds */
export function getAudioDuration(filePath: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
    { encoding: 'utf8' }
  );
  return parseFloat(out.trim());
}
