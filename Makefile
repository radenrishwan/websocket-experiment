json-private-test:
	date "+%Y-%m-%d %H:%M:%S" && echo "Running private test" && \
	K6_WEB_DASHBOARD=true k6 run test/src/json.private.test.ts
	date "+%Y-%m-%d %H:%M:%S" && echo "Private test done"
