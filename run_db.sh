#!/bin/bash

cd redis && docker compose up -d && cd ../postgres && docker compose up -d