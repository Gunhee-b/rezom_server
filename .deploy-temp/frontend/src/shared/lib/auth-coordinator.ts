// Authentication coordinator to prevent race conditions between useAuth and axios
// This ensures that token refresh operations are properly coordinated

class AuthCoordinator {
  private isRefreshing = false
  private refreshPromise: Promise<string | null> | null = null
  private waiters: Array<(token: string | null) => void> = []

  async requestRefresh(refreshFunction: () => Promise<string | null>): Promise<string | null> {
    if (this.isRefreshing) {
      // Wait for ongoing refresh
      return new Promise((resolve) => {
        this.waiters.push(resolve)
      })
    }

    this.isRefreshing = true
    this.refreshPromise = refreshFunction()

    try {
      const newToken = await this.refreshPromise
      
      // Notify all waiters
      this.waiters.forEach(waiter => waiter(newToken))
      this.waiters = []
      
      return newToken
    } catch (error) {
      // Notify all waiters of failure
      this.waiters.forEach(waiter => waiter(null))
      this.waiters = []
      throw error
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  isCurrentlyRefreshing(): boolean {
    return this.isRefreshing
  }
}

export const authCoordinator = new AuthCoordinator()