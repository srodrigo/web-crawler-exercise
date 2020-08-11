const createLogger = () => ({
  log: str => {
    console.log(str);
  },
});

const createSilentLogger = () => ({
  log: () => {},
});

export { createLogger, createSilentLogger };
