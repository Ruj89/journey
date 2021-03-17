function setCleanUp() {
    process.stdin.resume();

    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, cleanUpServer.bind(null, eventType));
    });

    function cleanUpServer() {
        console.log("cleaning db");
        database.close();
    }
}

module.exports = { setCleanUp: setCleanUp };