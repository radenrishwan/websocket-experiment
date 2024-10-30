json-private-test:
	date "+%Y-%m-%d %H:%M:%S" >> NOTE.md && echo "Running private test" && \
	k6 run test/src/json.private.test.js
	date "+%Y-%m-%d %H:%M:%S" >> NOTE.md && echo "Private test done"
json-room-test:
	date "+%Y-%m-%d %H:%M:%S" >> NOTE.md && echo "Running room test" && \
	k6 run test/src/json.room.test.ts
	date "+%Y-%m-%d %H:%M:%S" >> NOTE.md && echo "Room test done"
