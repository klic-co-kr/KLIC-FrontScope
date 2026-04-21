/**
 * 다운로드 진행 상태
 */
export interface DownloadProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  currentImage?: string;
}

/**
 * 진행 상태 콜백 타입
 */
export type ProgressCallback = (progress: DownloadProgress) => void;

/**
 * 다운로드 진행 상태 관리
 */
export class DownloadProgressTracker {
  private total: number;
  private completed: number = 0;
  private failed: number = 0;
  private callback?: ProgressCallback;

  constructor(total: number, callback?: ProgressCallback) {
    this.total = total;
    this.callback = callback;
  }

  /**
   * 성공 보고
   */
  reportSuccess(imageName?: string): void {
    this.completed++;
    this.notifyProgress(imageName);
  }

  /**
   * 실패 보고
   */
  reportFailure(imageName?: string): void {
    this.failed++;
    this.notifyProgress(imageName);
  }

  /**
   * 진행 상태 알림
   */
  private notifyProgress(currentImage?: string): void {
    if (!this.callback) {
      return;
    }

    const progress: DownloadProgress = {
      total: this.total,
      completed: this.completed,
      failed: this.failed,
      percentage: ((this.completed + this.failed) / this.total) * 100,
      currentImage,
    };

    this.callback(progress);
  }

  /**
   * 완료 여부
   */
  isComplete(): boolean {
    return (this.completed + this.failed) >= this.total;
  }

  /**
   * 리셋
   */
  reset(): void {
    this.completed = 0;
    this.failed = 0;
  }
}
