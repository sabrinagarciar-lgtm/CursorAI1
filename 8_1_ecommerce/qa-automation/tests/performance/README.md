# Performance tests

k6 load tests live in `../../performance/k6-load-test.js`.

Run via the master script:

```bash
./scripts/run-all-qa.sh --performance-only
```

Or directly (requires [k6](https://k6.io/docs/get-started/installation/)):

```bash
k6 run ../../performance/k6-load-test.js
```
