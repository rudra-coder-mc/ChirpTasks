#!/bin/bash

(cd frontend && npm run dev) &
(cd backend && npm run start:dev) &

wait
