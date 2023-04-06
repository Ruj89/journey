/**
 * Catch the close event to cleanup the server
 */
export function setCleanUp(callback) {
  process.stdin.resume();

  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, (e) => callback());
    process.on(`uncaughtException`, (e) => {
      console.error(e);
      callback();
    });
  });
}
