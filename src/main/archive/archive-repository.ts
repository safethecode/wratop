import { randomUUID } from 'node:crypto';
import { link, mkdir, readdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { TabArchive, TabArchiveSummary } from '../../shared/archive';
import { parseTabArchive } from './parse-archive';

export interface ArchiveRepository {
  delete(id: string): Promise<boolean>;
  get(id: string): Promise<TabArchive | null>;
  list(): Promise<readonly TabArchiveSummary[]>;
  save(archive: TabArchive): Promise<void>;
}

export class FileArchiveRepository implements ArchiveRepository {
  public constructor(private readonly directoryPath: string) {}

  public async delete(id: string): Promise<boolean> {
    this.assertArchiveId(id);

    try {
      await unlink(this.archivePath(id));
      return true;
    } catch (error: unknown) {
      if (this.isMissingFileError(error)) {
        return false;
      }

      throw error;
    }
  }

  public async get(id: string): Promise<TabArchive | null> {
    this.assertArchiveId(id);

    try {
      return await this.readArchive(this.archivePath(id));
    } catch (error: unknown) {
      if (this.isMissingFileError(error)) {
        return null;
      }

      throw error;
    }
  }

  public async list(): Promise<readonly TabArchiveSummary[]> {
    await mkdir(this.directoryPath, { recursive: true });
    const fileNames = await readdir(this.directoryPath);
    const archives = await Promise.all(
      fileNames
        .filter((fileName) => fileName.endsWith('.json'))
        .map((fileName) => this.readArchive(path.join(this.directoryPath, fileName))),
    );

    archives.sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return archives.map((archive) => ({
      createdAt: archive.createdAt,
      id: archive.id,
      name: archive.name,
      tabCount: archive.windows.reduce((count, window) => count + window.tabs.length, 0),
      windowCount: archive.windows.length,
    }));
  }

  public async save(archive: TabArchive): Promise<void> {
    this.assertArchiveId(archive.id);
    await mkdir(this.directoryPath, { recursive: true });

    const temporaryPath = path.join(this.directoryPath, `.${archive.id}.${randomUUID()}.tmp`);

    try {
      await writeFile(temporaryPath, `${JSON.stringify(archive, null, 2)}\n`, {
        encoding: 'utf8',
        flag: 'wx',
        flush: true,
      });
      await link(temporaryPath, this.archivePath(archive.id));
    } finally {
      await rm(temporaryPath, { force: true });
    }
  }

  private archivePath(id: string): string {
    return path.join(this.directoryPath, `${id}.json`);
  }

  private assertArchiveId(id: string): void {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(id)) {
      throw new Error('Invalid archive ID');
    }
  }

  private async readArchive(archivePath: string): Promise<TabArchive> {
    const serialized = await readFile(archivePath, 'utf8');
    return parseTabArchive(serialized);
  }

  private isMissingFileError(error: unknown): boolean {
    return error instanceof Error && 'code' in error && error.code === 'ENOENT';
  }
}
