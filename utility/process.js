/**
 * Catch the close event to cleanup the server
 */
function setCleanUp(callback) {
  process.stdin.resume();

  [
    `exit`,
    `SIGINT`,
    `SIGUSR1`,
    `SIGUSR2`,
    `uncaughtException`,
    `SIGTERM`,
  ].forEach((eventType) => {
    process.on(eventType, () => callback());
  });
}

module.exports = { setCleanUp: setCleanUp };
