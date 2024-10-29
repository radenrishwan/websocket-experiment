json-private-test:
	date "+%Y-%m-%d %H:%M:%S" >> NOTE.md && echo "Running private test" && \
	k6 run test/src/json.private.test.ts
	date "+%Y-%m-%d %H:%M:%S" >> NOTE.md && echo "Private test done"
