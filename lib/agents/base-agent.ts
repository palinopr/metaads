/**
 * Base Agent Class
 * Common functionality for all specialized agents
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Task {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  dependencies?: string[];
}

export abstract class BaseAgent extends EventEmitter {
  protected name: string;
  protected tasks: Task[] = [];
  protected completedTasks: string[] = [];
  protected currentTask: Task | null = null;
  protected progress: number = 0;

  constructor(name: string) {
    super();
    this.name = name;
  }

  abstract async execute(): Promise<void>;
  abstract getTasks(): Task[];

  protected async executeTask(task: Task) {
    try {
      this.currentTask = task;
      task.status = 'in-progress';
      this.emitProgress();

      // Task-specific execution
      await this.performTask(task);

      task.status = 'completed';
      this.completedTasks.push(task.id);
      this.emit('task-completed', task.name);
      
    } catch (error) {
      task.status = 'failed';
      this.emit('task-failed', { task: task.name, error: error.message });
      throw error;
    } finally {
      this.currentTask = null;
      this.updateProgress();
    }
  }

  protected abstract async performTask(task: Task): Promise<void>;

  protected updateProgress() {
    const totalTasks = this.tasks.length;
    const completedCount = this.tasks.filter(t => t.status === 'completed').length;
    this.progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
    this.emitProgress();
  }

  protected emitProgress() {
    this.emit('progress', {
      progress: this.progress,
      tasks: this.tasks.map(t => ({
        name: t.name,
        status: t.status
      })),
      currentTask: this.currentTask?.name || null
    });
  }

  protected async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return '';
      }
      throw error;
    }
  }

  protected async writeFile(filePath: string, content: string) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  protected async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  protected async ensureDirectory(dirPath: string) {
    await fs.mkdir(dirPath, { recursive: true });
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.name}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getProgress(): number {
    return this.progress;
  }

  getCompletedTasks(): string[] {
    return this.completedTasks;
  }

  getCurrentTask(): Task | null {
    return this.currentTask;
  }
}